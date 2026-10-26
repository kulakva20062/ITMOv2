# ДЗ. /speckit-constitution

## Сессия `h0-constitution` — общий чат

Промпт:

```text
/speckit-constitution
Это существующий проект (brownfield). Сформулируй конституцию из уже действующих правил AGENTS.md и docs/style-guide.md, ничего не выдумывая сверх них: чистые HTML/CSS/JS без зависимостей и сборщиков (сервер — только встроенные модули Node 24), логика — чистые функции в src/ под тестами node --test, sh scripts/check.sh зелёный после каждой правки, только вымышленные данные, без внешних ресурсов, контракт docs/requirements.md и существующие тесты не ослабляются, коммит делает студент. Добавь принцип для работы двух команд: UI и логика согласуют общий контракт до кода, контракт — единственный источник имён полей, кодов ошибок и состояний.
Не меняй другие файлы, кроме .specify/memory/constitution.md.
```

- session_id: `8ff90f0f-1d28-4289-8956-60e7a59a79ad`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (8):
  1. `Bash` ls -a /home/kulakva/Documents/ITMOv2/practices/practice_05/project; echo ---; ls /home/kulakva/Documents/ITMOv2/practices/practice_05/projec …
  2. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/AGENTS.md
  3. `Bash` .specify/scripts/bash/resolve-template.sh constitution-template --json 2>&1 | head -c 8000
  4. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/memory/constitution.md
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/style-guide.md
  6. `Bash` cat scripts/check.sh && echo "=== pkg" && cat package.json && echo "=== src" && ls src tests && echo "=== req head" && head -40 docs/require …
  7. `Bash` sed -n '40,200p' docs/requirements.md
  8. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/memory/constitution.md
- итог: success, 9 ходов, 89 с

Ответ агента:

Готово. Изменён только `.specify/memory/constitution.md`.

## Версия и обоснование

**1.0.0** — первичная ратификация. Файл до этого содержал незаполненный шаблон (`[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]` и т.д.), так что это не поправка, а первое наполнение: пять принципов, два раздела ограничений и Governance.

Принципы выведены из уже действующих правил, без добавления новых:

| Принцип | Источник |
|---|---|
| I. Чистый стек без зависимостей | AGENTS.md (стек, `node --test`) |
| II. Логика — чистые функции в `src/` под тестами | AGENTS.md + style-guide п.6 |
| III. Зелёный `scripts/check.sh` после каждой правки | AGENTS.md «Проверка» |
| IV. Только вымышленные данные, без внешних ресурсов | AGENTS.md «Правила» |
| V. Контракт до кода — единственный источник имён | ваше дополнение про две команды |

Визуальные правила (`docs/style-guide.md`) вынесены в раздел «Визуальные и технические ограничения»; неослабление контракта `docs/requirements.md`/тестов и «коммит делает студент» — в «Рабочий процесс и приёмка».

## TODO / требует вашего решения

1. **`TODO(RATIFICATION_DATE)`** — поставил 2026-10-23 как дату первой письменной ратификации. Сами правила действовали в AGENTS.md раньше; если нужна их исходная дата, скажите, и я поправлю.
2. **Расхождение по серверу.** Вы указали «сервер — только встроенные модули Node 24», и я записал это в принцип I. Но серверного кода в проекте нет, а `docs/requirements.md` и `package.json` (`scripts.start`) предписывают отдавать страницу статикой через `python3 -m http.server 8000`. Формулировка в конституции условная («если появляется серверный код»), так что прямого противоречия нет, но несоответствие отмечено в Sync Impact Report — правка требований или `package.json` вне объёма этой команды.

Sync Impact Report лежит HTML-комментарием в начале файла — это материал для ревью поправки, его убирают перед коммитом.

Предлагаемое сообщение коммита (коммит делаете вы):

```
docs: ратификация конституции проекта v1.0.0
```
