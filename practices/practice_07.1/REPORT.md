# Практика 7.1 — Ассистент для код-ревью в n8n (M3202, Kulakovskii Vlad)

## Файлы

- [ai-code-review.workflow.json](workflows/ai-code-review.workflow.json) — основной сценарий для Import from File в n8n.

Из каталога `practices/practice_07.1` команда `just start` открывает редактор учебного n8n. Команда `just test` запускает на том же сайте проверку ревью, inline-комментариев, дедупликации и записей `ai_reviewed_prs`. Проверка читает результаты в GitHub и n8n и возвращает ссылку на Execution. Для команд нужен Python 3. Токен проверки берётся из `N8N_TEST_TOKEN` или из `~/.config/itmo-practice07/test-token`. [Редактор 7.1](https://n8n-itmo.cyrweb.ru/workflow/5TxcZj0jrj1W74VS)

На учебном сайте модели подключены через KeyShop Responses API. Основное ревью использует `kimi-k3.1-pro`, второе мнение — `kimi-k2.6`.

## Что делает сценарий

```
GitHub Trigger (pull_request + issue_comment)
  → Route event (Switch) ──┬─ pull_request.opened ─────────────► Mode: primary (PR opened) ─┐
                           ├─ /make_ai_review (комментарий) ─► Mode: primary (/make_ai_review) ┤
                           ├─ /make_other_ai_review ─────────► Mode: other ────────────────────┤
                           └─ всё остальное → Ignore other events (NoOp)                       │
                                                                                               ▼
                              Context (Code: PR, модель, источник запуска)
                                                                                               │
                        Primary model? ──primary──► Data Table «already reviewed?» ──дубль──► Comment: review skipped
                              │ other (второй моделью всегда можно)                              │ нет записи
                              └──────────────────────────────┬────────────────────────────────────┘
                                                                             ▼
                          Get PR → Get PR files (patch-и) → Split diff into hunks (Code)
                                                                             ▼
                        Which model? → Review · primary model | Review · other model
                        (chainLlm + lmChatOpenAi: Kimi k2.6 / Kimi k2.5)
                                                                             ▼
                          Build inline review (Code: 1 комментарий на каждый блок diff)
                                                                             ▼
              POST /pulls/{n}/reviews (inline-комментарии; при ошибке — Fallback: обычный комментарий)
                                                                             ▼
              Data Table: save reviewed PR (ai_reviewed_prs) → Add label ReviewedByAI
```

Соответствие уроку (M3202): базовый шаблон gist-а → +
1. флоу срабатывает только на открытие PR (`action == "opened"`, Switch вместо цепочки If — то же условие);
2. ревью по команде `/make_ai_review` (триггер слушает `issue_comment`, команда сравнивается по первому слову);
3. ДЗ-шаг 1: `/make_other_ai_review` — вторая модель;
4. ДЗ-шаги 2–3: Data Table `ai_reviewed_prs` (id PR сохраняется после ревью, повторный `/make_ai_review` не запускает ревью);
5. ДЗ-шаг 4 («звёздочка»): diff режется на блоки (`Split diff into hunks`), по каждому блоку — свой inline-комментарий GitHub review с привязкой к строкам (`path`, `line`, `start_line`, side RIGHT/LEFT).

## Модели

LLM подключён через [OI]-совместимый credential `openAiApi` с именем **«OpenAi (Kimi)»** — базовый URL провайдера Kimi, API-ключ модели, совместимой с `chat/completions`.

- Основная модель: **`kimi-k2.6`** (ноды `Model: kimi-k2.6`, ревью по PR opened и `/make_ai_review`, классификатор/фиксер в 7.2).
- Вторая модель: **`kimi-k2.5`** (нода `Model: kimi-k2.5`, `/make_other_ai_review` и AI-ревьюер в ★★).

Если ваш экземпляр n8n показывает другой список моделей в credential — выберите две **разные** Kimi-модели в нодах «Model: …» (правый клик → Open node → модель). Больше нигде имя модели не захардкожено, вся логика не зависит от конкретного имени.

## Как импортировать и настроить (для сдачи)

1. Открыть свой n8n → **Create Workflow** → меню `⋮` → **Import from file** → выбрать `ai-code-review.workflow.json` (или Ctrl+C содержимое файла → Ctrl+V на пустом канвасе).
2. Создать credentials:
   - **GitHub account** (`githubApi`, token classic c правами `repo` + `admin:repo:hooks`) — токен: https://github.com/settings/tokens. Один credential идёт и в триггер, и в HTTP-ноды, и в GitHub-ноды.
   - **OpenAi (Kimi)** (`openAiApi`, API key Kimi) — в нодах «Model: kimi-k2.6» и «Model: kimi-k2.5».
3. Заменить репозиторий в `GitHub Trigger` (owner/repo) на свой тестовый (для проверки важно, чтобы токен имел права на создание webhook — то есть вы владелец репозитория или он в вашей организации).
4. Вручную запустить [Setup Data Tables](../practice_07.2/workflows/wf-setup-data-tables.workflow.json) для создания `ai_reviewed_prs`, `processed_issues`, `weekly_stats` и `bugfix_runs`.
5. Опубликовать (Publish/Activate) сценарий, создать PR → в PR появится review с inline-комментариями, PR получит лейбл `ReviewedByAI`.

## Что показывать ревьюверу

- **Выбор модели** — Switch «Which model?» от поля `mode` из Context; у двух веток review — разные ноды модели (`kimi-k2.6` и `kimi-k2.5`). Результаты двух моделей в тестах отличаются по акцентам: основная (k2.6) даёт структурированный JSON-разбор по блокам, вторая (k2.5) — более «человеческий» текст с другими приоритетами (в тест-прогоне k2.5 отметила `eval` как security-проблему и попросила docstring для `median`, k2.6 — безопасный парсер конфига и обработку KeyError).
- **Где хранится состояние** — Data Table `ai_reviewed_prs`, ключ `pr_key` = `owner/repo#номер`, плюс `mode`, `model`, `trigger`, `review_id`, `reviewed_at`. Сценарий решает «запускать ли ревью» так: после Context идёт If «Primary model? (dedup only for it)» → для primary-режима ищется строка в таблице по `pr_key` → если есть (If «PR already in table?») → только комментарий-уведомление о пропуске, без запроса к LLM; если нет — полный флоу и запись после публикации.
- **Повторный `/make_ai_review`** — не вызывает модель: Execution содержит `Route event → Mode → Context → Data Table → Comment: review skipped (duplicate)` и заканчивается. Ссылка на запись в таблице и дата первого ревью прикладываются в комментарии. `/make_other_ai_review` сознательно НЕ дедуплицируется — второе мнение разрешено в любой момент (это тестировалось: после skip-команды другой модели ревью всё равно публикуется).
- **Точечные комментарии**. Workflow читает страницы файлов PR, разбивает возвращённые GitHub текстовые патчи на блоки и отправляет модели их группами по десять. Модель возвращает `{summary, comments:[{hunk, severity, comment}]}`. `Build inline review` проверяет, что все блоки получили комментарии, и формирует `POST /pulls/{n}/reviews` с координатами `path`, `line`, `side` и SHA коммита. На один блок модели передаётся до 120 строк и 3000 символов. При ошибке inline-публикации workflow отправляет общий комментарий и сохраняет результат в Data Table.

## Что приложено для сдачи

- Экспорт сценария в [workflows](workflows/ai-code-review.workflow.json).
- [Тестовый PR](https://github.com/kulakva20062/practice-7-n8n-demo/pull/1) содержит два ревью на одном diff и уведомление о пропуске повторной команды. В демонстрации использованы Gemma 3 4B и Qwen3 8B через Ollama.
- [Скриншоты Executions и строки Data Table](https://github.com/kulakva20062/practice-7-n8n-demo#71--ревью-pr) опубликованы вместе с результатами.

## Локальный прогон (как тестировался JSON)

На n8n 2.47.7 с заглушками GitHub и LLM проверены открытие PR, повторный `/make_ai_review` без вызова модели, `/make_other_ai_review` с другой моделью и запись результатов в Data Table. В тесте с двумя страницами файлов каждая модель вернула 101 inline-комментарий. При ручных Executions с реальными событиями GitHub обе модели опубликовали по два inline-комментария. События получены через GitHub CLI и сохранены как входы сценария.

## Критерии оценки (12 баллов)

| # | Критерий | Где подтверждение |
|---|---|---|
| 1 | `/make_other_ai_review` запускает ревью второй моделью, результат в PR (2 балла) | Switch Route event ветка 2 → Mode: other → Which model? ветка other → Model: kimi-k2.5 → Post review; в PR появляется «🤖 Второе мнение · kimi-k2.5» |
| 2 | Data Table создана, id PR сохраняется после ревью (2 балла) | wf-setup-data-tables → таблица `ai_reviewed_prs`; узел «Data Table: save reviewed PR» (показать содержимое таблицы) |
| 3 | Повторный `/make_ai_review` не запускает ревью (3 балла) | Execution при повторной команде: …→ Comment: review skipped (duplicate) — модель не вызывается |
| 4 | Точечные комментарии к каждому блоку (5 баллов) | GitHub review с N inline-комментариями по hunks (см. «Что показывать ревьюверу», пункт про `Split diff into hunks`) |
