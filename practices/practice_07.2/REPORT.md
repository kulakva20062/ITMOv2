# Практика 7.2 — Поддержка пользователя с помощью AI-инструментов (M3202, Kulakovskii Vlad)

## Файлы сценариев

В папке `workflows/7.2/`:

| Файл | Workflow | Назначение |
|---|---|---|
| `wf1-issue-triage.workflow.json` | `7.2 WF1: GitHub Issues triage (classify → label)` | Основной сценарий (часть 1, пункты 1–2) |
| `wf1-sub-issue-classifier.workflow.json` | `7.2 Sub-workflow: issue classifier` | Sub-workflow классификатора (часть 1, пункт 3) |
| `wf-weekly-stats.workflow.json` | `7.2 Weekly Issues stats → Gmail (Δ + AI comment)` | Часть 2, пункты 4–9 + звёздочка |
| `wf-setup-data-tables.workflow.json` | `7.x Setup: create Data Tables (run once)` | Создаёт 4 Data Table (запустить один раз) |
| `wf-bugfix-autopilot.workflow.json` | `7.2 ★★ Bugfix autopilot` | Задача на сверхрезультат (10 баллов) |

Импорт любого файла: Create Workflow → меню ⋮ → **Import from file**, либо Ctrl+C содержимое → Ctrl+V на пустом канвасе. Затем подставить credentials (GitHub + OpenAI Kimi + Gmail) и Publish.

## Часть 1: WF1 — классификация Issues

```
GitHub Trigger (issues)
  → If action == "opened"
      false → Ignore (not opened)
      true  → Prepare issue (Set: title, body, author, association, issue_number, html_url)
  → Data Table «issue processed?» (processed_issues по issue_key)
      дубль → Skip duplicate (no reply)
      новый → If First-time contributor? (author_association ∈ {NONE, FIRST_TIMER, FIRST_TIME_CONTRIBUTOR})
                true → Label first-time-contributor + Welcome comment (с ссылкой на CONTRIBUTING.md)
                false → (пропускаем приветствие)
  → Classify (Execute Workflow → wf1-sub-issue-classifier) → {type, confidence, reason}
  → Switch «Route by type (confidence ≥ 0.8)»
       bug (type == "bug" && confidence ≥ 0.8)     → bug: label + comment
       task                                        → task: label + comment
       feature                                     → feature: label + comment
       fallback (unknown / confidence < 0.8)       → unknown: needs-triage, **без комментария**
  → Add type label (POST /issues/{n}/labels)
  → If Has comment? (needs-triage → no)  ─ true → Post template comment
  → Data Table: mark issue processed
```

Классификатор (sub-workflow):
```
Execute Workflow Trigger (input: title, body)
  → Basic LLM Chain (chainLlm, promptType define)
      ← Model: kimi-k2.6 (lmChatOpenAi)
      ← Structured Output Parser (schemaType manual, inputSchema: type bug|task|feature|unknown, confidence 0..1, reason)
  → Normalize type & confidence (Code): type ∉ списка → "unknown", confidence >1 && ≤100 → /100
```
Sub-workflow возвращает **только** `{type, confidence, reason}` — основной сценарий ничего не знает о LLM, просто вызывает его по id.

## Часть 2: Weekly stats → Gmail

```
Schedule Trigger (cron 0 9 * * MON, tz Europe/Moscow)   ← также Manual trigger для ручного прогона
  → Config (owner/repo, since = now−7d, until = now, report_to = YOUR_EMAIL@gmail.com)
  → GH: issues opened this week (Search API: is:issue created:>=since)
  → GH: issues closed this week (is:issue closed:>=since)
  → GH: PRs opened this week (is:pr created:>=since)
  → GH: PRs merged this week (is:pr merged:>=since)
  → Group by type & author (Code) — группировка по лейблу (bug/task/feature/needs-triage) и по автору (issue.user.login)
  → Data Table: load history (weekly_stats, все записи)
  → Compute Δ vs previous week (Code): самая свежая строка с week_start < текущей → delta по каждой метрике
  → Data Table: save this week (upsert по week_start)
  → Stats for AI → AI comment of the week (chainLlm + Kimi k2.6, prompt со статистикой и Δ)
  → Build HTML email (Code: таблица сводки с Δ, таблица по автору, блок «🤖 AI-комментарий недели»)
  → Gmail: send weekly report (gmailOAuth2, html)
```

4 запроса GitHub Search API идут последовательно (Config → r1 → r2 → r3 → r4). Для ручного теста жать Execute workflow не нужно ждать понедельника — cron настроен, но Manual trigger даёт тот же флоу.

Звёздочка: (7) `Data Table: save this week` — upsert строки недели со всеми метриками; (8) `Compute Δ vs previous week` читает прошлую неделю из таблицы, в письме столбец Δ с окраской +/-; (9) `AI comment of the week` — Basic LLM Chain на основе `current`, `by_author`, `previous`, `delta` → в HTML блок «AI-комментарий недели». Setup-сценарий при первом запуске также **создаёт тестовую запись прошлой недели** (это разрешено README: «вторую неделю можно сымитировать тестовой записью»).

## ★★ Сверхрезультат: Bugfix autopilot

```
GitHub Trigger (issues) → If labeled == "bug" && issue.state == "open"
  → Bug context → Data Table: already fixing? (bugfix_runs) — дедупликация
  → Get repo tree (git/trees/main?recursive=1)
  → Pick source files (Code: .py/.js/.ts/..., до 12 файлов, не тесты/доки)
  → Get file contents (per file, base64)
  → Prepare fix prompt (Code: исходники с номерами строк + текст bug report)
  → AI fixer (chainLlm + Kimi k2.6 + Structured Output Parser: path, new_content, commit_message, explanation)
  → Validate fix (Code: файл из кандидатов, содержимое изменилось, branch = ai-fix/issue-N-...)
  → Get base branch sha → Create fix branch (POST /git/refs) → Commit fixed file (PUT /contents/{path})
  → Open fix PR (title, head=branch, base=main, body с "Fixes #N")
  → Get PR diff → Prepare review prompt
  → AI reviewer (chainLlm + Kimi k2.5 + Structured Output Parser: verdict approve|changes_requested, serious_issues, summary)
  → Post AI review to PR (event COMMENT, body с verdict и списком серьёзных замечаний)
  → If Approved, no serious issues?
      true  → Squash-merge into main (PUT /pulls/{n}/merge) → Comment on issue: fixed → Data Table: record run (merged=true)
      false → Label needs-human-review → Data Table: record run (merged=false)
```

Ядро автоматизации — n8n; GitHub используется как хранилище и источник событий, LLM (Kimi) — как фиксер и ревьюер. Дедупликация через `bugfix_runs`, чтобы один Issue не порождал ветки бесконечно. После мерджа Issue закрывается автоматически, потому что тело PR содержит `Fixes #N`.

## Как импортировать и настроить (для сдачи)

1. Импортировать **wf-setup-data-tables** → запустить вручную один раз → в Data Tables появятся `ai_reviewed_prs`, `processed_issues`, `weekly_stats` (+тестовая запись прошлой недели), `bugfix_runs`.
2. Импортировать **wf1-sub-issue-classifier**, затем **wf1-issue-triage**, **wf-weekly-stats**, **wf-bugfix-autopilot** (и **7.1 ai-code-review**, если делаете 7.1).
3. Создать credentials:
   - **GitHub account** (githubApi, classic PAT: `repo` + `admin:repo:hooks`) — во всех GitHub Trigger и HTTP-нодах.
   - **OpenAi (Kimi)** (openAiApi) — во всех «Model: …» нодах (основная `kimi-k2.6`, вторая `kimi-k2.5`).
   - **Gmail account** (gmailOAuth2) — в ноде «Gmail: send weekly report».
4. В Config weekly-stats заменить `YOUR_EMAIL@gmail.com` на свою почту, а owner/repo — на тестовый репозиторий. В триггерах WF1/autopilot/7.1 — тот же репозиторий.
5. Publish всех сценариев. Создать тестовые Issues: явный bug (шаги воспроизведения), feature (новая возможность), task (вопрос), расплывчатый («Иногда не работает»), и Issue от нового аккаунта (author_association NONE) для ветки first-time-contributor.

## Что показывать ревьюверу

- **Как классификатор возвращает тип/confidence и Switch выбирает ветку** — Basic LLM Chain с Structured Output Parser (schemaType manual) → parser возвращает готовый объект, `$json.type` и `$json.confidence`; Switch идёт сверху вниз по правилам `type == X && confidence ≥ 0.8`, первое совпадение выигрывает; fallback (options.fallbackOutput = "extra") → ветка unknown.
- **Почему Issue попал в needs-triage и почему нет комментария** — при confidence < 0.8 **или** type == unknown ни одно из трёх правил не совпадает → fallback → Set `unknown: needs-triage, no comment` (поле comment пустое) → Add type label → If Has comment? = false → ветка комментария пропускается, только Data Table: mark issue processed. Комментария в Issue нет.
- **Sub-workflow** — нода Execute Workflow (source database, workflowId = sub-workflow, waitForSubWorkflow) передаёт `{title, body}`; sub-workflow с Execute Workflow Trigger принимает их и возвращает последний выход (Code Normalize). Входящие поля появляются автоматически из workflowInputs.
- **Какие запросы к GitHub API** — Search API `q=repo:OWNER/REPO is:issue created:>=SINCE` (аналогично closed, is:pr created/merged) с per_page=100; Code node группирует items по `labels[].name` (первый из bug/task/feature/needs-triage) и по `user.login`.
- **Звёздочка** — данные прошлой недели из Data Table `weekly_stats` (самая свежая строка с week_start < текущего), Δ = текущая − прошлая; LLM получает JSON current/by_author/previous/delta и пишет аннотацию, которая вставляется в HTML письма в блок «AI-комментарий недели».

## Критерии оценки (16 баллов)

| # | Критерий | Где подтверждение |
|---|---|---|
| 1 | Issue классифицируется bug/task/feature, лейбл проставлен (2) | Executions WF1: Route by type → Add type label; в репозитории Issues с лейблами |
| 2 | confidence < 0.8 → needs-triage (1) | Executions: Route by type[0,0,0,1] → unknown: needs-triage, no comment; Issue с лейблом needs-triage и без комментария |
| 3 | Классификатор в Sub-workflow через Execute Workflow (2) | Отдельный workflow + нода Execute Workflow в WF1, поведение типов не изменилось (Executions) |
| 4 | Cron + 4 запроса за неделю (2) | Schedule Trigger 0 9 * * MON; Executions: GH: issues opened/closed, PRs opened/merged |
| 5 | Code node группирует по типу и автору (2) | Group by type & author (jsCode видно в ноде) |
| 6 | HTML-письмо через Gmail node (2) | Скриншот полученного письма (таблица статистики) + нода Gmail: send weekly report |
| 7 | Статистика недели в Data Table (1) | Data Table: save this week (upsert по week_start), содержимое weekly_stats |
| 8 | Δ к прошлой неделе в письме (2) | Столбец Δ в HTML-таблице письма |
| 9 | Блок «AI-комментарий недели» от AI (2) | chainLlm AI comment of the week → блок в письме |

## Локальный прогон

E2E на локальном стенде (n8n 2.47.7 + mock GitHub + локальные модели) прошёл все этапы: bug Issue → label bug + шаблонный комментарий; feature → feature; task → task; расплывчатый («Иногда не работает») → needs-triage **без комментария**; first-time contributor → лейбл + приветствие; повторное открытие (reopened → повторный opened) → skip без ответа. Sub-workflow вызывается из WF1 через Execute Workflow. В реальной сдаче модели заменяются на Kimi — меняются только имена в нодах модели, логика идентична.
