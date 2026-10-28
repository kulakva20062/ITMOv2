# ДЗ. Команда 1: plan, tasks, implement

## Сессия `h6-ui-plan` — КОМАНДА 1

Промпт:

```text
Команда 2 реализовала логику и API по общему контракту: src/booking.js (validateBooking, ERROR_CODES, todayUtc, addDays, BOOKING_HORIZON_DAYS …), src/booking-store.js, server.js (статика + /api на 8000), formatDate в src/format.js. Их код можно читать и импортировать, но не менять; контракт specs/contracts/booking-contract.md — источник имён.
Работаем над своей фичей specs/001-booking-ui: сначала обнови .specify/feature.json, чтобы он указывал на specs/001-booking-ui.
/speckit-plan Чистые HTML/CSS/JS без зависимостей; тексты UI и выбор состояния — чистые функции (src/booking-text.js, src/booking-form.js) под node --test; связка с DOM в src/main.js; разметка формы в index.html после итога калькулятора; стиль по docs/style-guide.md; проверка в браузере через MCP playwright на 360 и 1280 px.
Затем /speckit-tasks. Код не пиши, остановись после tasks.
```

- session_id: `b21e12b8-3ab5-4706-9fb6-ec1a955ab908`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (25):
  1. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/feature.json
  2. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/booking.js
  3. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/format.js
  4. `Bash` ls -1 src tests *.js *.json *.md 2>/dev/null; echo "=== check.sh ==="; cat scripts/check.sh; echo "=== package.json ==="; cat package.json
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/server.js
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/render.js
  7. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/index.html
  8. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/index.test.js
  9. `Grep` Фича|booking|заявк
  10. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/contrast-mcp.test.js
  11. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/requirements.md
  12. `Skill` speckit-plan
  13. `Bash` sh .specify/scripts/bash/setup-plan.sh --json
  14. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/scripts/bash/setup-plan.sh
  15. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/templates/plan-template.md
  16. `Bash` grep -n -A6 -E '^\.(field__control|button|calc__error|rail|section__note)' styles.css | head -70; echo "=== media ==="; grep -n "@media" sty …
  17. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/plan.md
  18. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/research.md
  19. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/data-model.md
  20. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/contracts/ui-modules.md
  21. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/quickstart.md
  22. `Skill` speckit-tasks
  23. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/templates/tasks-template.md
  24. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/tasks.md
  25. `Bash` sh scripts/check.sh 2>&1 | tail -8; echo "=== feature.json ==="; cat .specify/feature.json; echo "=== artifacts ==="; ls -1 specs/001-bookin …
- итог: success, 28 ходов, 604 с

Ответ агента:

`feature.json` → `specs/001-booking-ui`. Plan и tasks готовы, код не писал. `sh scripts/check.sh` зелёный: **174/174** (база с кодом команды 2 — это и есть отсчёт для T001).

## Артефакты

| Файл | Что внутри |
|---|---|
| `specs/001-booking-ui/plan.md` | техконтекст, Constitution Check, структура, таблица «чужой код: что импортируем», риски |
| `specs/001-booking-ui/research.md` | 10 решений (R-01…R-10) + разбор чужого кода |
| `specs/001-booking-ui/data-model.md` | 6 сущностей UI, автомат пяти состояний с диаграммой переходов |
| `specs/001-booking-ui/contracts/ui-modules.md` | публичный интерфейс `booking-text.js` и `booking-form.js` + контракт разметки |
| `specs/001-booking-ui/quickstart.md` | 16 браузерных сценариев на 360 и 1280 px, признаки незавершённости |
| `specs/001-booking-ui/tasks.md` | **54 задачи**, 6 фаз |

Хуков нет (`.specify/extensions.yml` отсутствует) — ни до, ни после plan/tasks.

## Разбивка задач

- Phase 1 Setup — 3 · Phase 2 Foundational — 13 · **US1 (MVP) — 11** · US2 — 12 · US3 — 9 · Polish — 6
- MVP = Setup + Foundational + US1: заявка отправляется и номер виден на экране.
- Все 54 задачи в формате `- [ ] T### [P?] [US?] описание с путём к файлу`.

## Что выяснилось при чтении чужого кода и повлияло на план

1. **`src/booking-text.js` ещё нет** — контракт §3 относит его к UI, так что это наш файл, а не готовый. Проверку полей писать не нужно: `validateBooking` команды 2 вызывается напрямую, поэтому расхождение «UI считает валидным, сервер нет» исключено по построению.
2. **`addDays` и `formatDate` бросают `RangeError`** на битом входе. Значит ветка FR-025 «при непрочитанном `conflict`» — это не только `conflict == null`, а защита от исключения. Вынес в R-09 и в задачи T033, T021.
3. **Реальный риск для существующих тестов.** `tests/index.test.js:104` ищет поле срока регуляркой от **первого** `<input>` в документе, и в `index.html:75-76` стоит предупреждение про это. Разобрал по шести рискованным тестам (research R-09): секция `#booking` **после** `#calculator` ничего не ломает, подтверждено T013 как отдельной задачей-проверкой.
4. **`.field__control[aria-invalid='true']` уже оформлен** в `styles.css` — переиспользуется, новых цветов не нужно, поэтому `tests/contrast-mcp.test.js` трогать не придётся.

## Одно место, где нужно твоё решение

**Слаги состояний.** Контракт §7 называет состояния только по-русски, а FR-020 требует машиночитаемый признак для `data-state`. Ввёл `BOOKING_STATES` (`no-estimate`, `editing`, `submitting`, `success`, `unavailable`) — 1:1 с §7, объявлены в одном месте, новых состояний нет. Это единственное производное имя в фиче; помечено в plan.md, research R-02 и contracts/ui-modules.md как предмет сверки с командой 2. Если хочешь, чтобы слаги попали в контракт — это отдельная согласованная правка §7 до кода.

Остановился после tasks, как просил. Следующий шаг — `/speckit-implement` или `/speckit-analyze` для сверки spec ↔ plan ↔ tasks.

## Сессия `h7-ui-impl` — КОМАНДА 1 (прервана недельным лимитом)

Промпт:

```text
Plan и tasks приняты. Слаги состояний внесены владельцем в контракт §7 (no-estimate, editing, submitting, success, unavailable).
/speckit-implement
Реализуй specs/001-booking-ui по tasks.md. Код команды 2 (src/booking.js, src/booking-store.js, server.js, src/format.js) не меняй — только импортируй. sh scripts/check.sh зелёный после каждой правки; существующие тесты не меняй.
Сервер уже запущен владельцем: node server.js на http://localhost:8000/ (статика + /api) — не останавливай и не перезапускай его. Сценарии quickstart пройди в браузере через MCP playwright на 360 и 1280 px; скриншоты только в /tmp/p5-playwright. Для сценария «сервер недоступен» используй перехват запроса в браузере (route / подмена fetch), а не остановку сервера.
Если появится решение, меняющее контракт, — остановись и опиши его.
В конце: что сделано, результаты check.sh и браузерных сценариев.
```

- session_id: `b21e12b8-3ab5-4706-9fb6-ec1a955ab908`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (65):
  1. `Skill` speckit-implement
  2. `Bash` sed -n '231,275p' specs/contracts/booking-contract.md
  3. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/index.html
  4. `Bash` node -e " import('./src/booking.js').then(m => { const need = ['validateBooking','ERROR_CODES','todayUtc','addDays','BOOKING_HORIZON_DAYS',' …
  5. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/booking-text.js
  6. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/booking-form.js
  7. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-text.test.js
  8. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/cars.js
  9. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  10. `Bash` node -e " import('./src/format.js').then(m => { const s = m.formatPrice(14400); console.log(JSON.stringify(s)); console.log([...s].map(c =>  …
  11. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  12. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  13. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  14. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  15. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/index.html
  16. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/index.html
  17. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-markup.test.js
  18. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  19. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  20. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  21. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  22. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  23. `Bash` grep -n "clearResult()\|calculate()\|refreshBooking()\|^let estimate\|^renderFleet" src/main.js
  24. `Bash` grep -n -E "^\.(calc|field|extra|receipt)" styles.css | head -40; echo "=== 60rem block ==="; sed -n '616,700p' styles.css
  25. `Bash` sed -n '345,400p' styles.css; echo "=== 448-470 ==="; sed -n '448,470p' styles.css; echo "=== 30rem tail ==="; sed -n '700,740p' styles.css
  26. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  27. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  28. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_resize,mcp__playwright__browser_snapshot,mcp__playwright__brows …
  29. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  30. `mcp__playwright__browser_navigate` http://localhost:8000/
  31. `mcp__playwright__browser_console_messages` {"level": "error"}
  32. `Bash` curl -s http://localhost:8000/src/format.js | tail -12; echo "=== headers ==="; curl -s -D - -o /dev/null http://localhost:8000/src/format.j …
  33. `mcp__playwright__browser_evaluate` {"function": "() => import('/src/format.js?bust=' + Date.now()).then(m => Object.keys(m).join(','))"}
  34. `Bash` wc -c src/format.js; ls -la --time-style=+%H:%M:%S src/format.js
  35. `mcp__playwright__browser_navigate` http://localhost:8000/index.html
  36. `mcp__playwright__browser_close` {}
  37. `mcp__playwright__browser_navigate` http://localhost:8000/
  38. `mcp__playwright__browser_console_messages` {"level": "error"}
  39. `mcp__playwright__browser_network_requests` {"static": true, "filter": "\\.js"}
  40. `mcp__playwright__browser_evaluate` {"function": "async () => {\n const mod = await import('/src/format.js');\n const viaRelative = await import('./src/format.js');\n const tex …
  41. `ToolSearch` {"query": "select:mcp__playwright__browser_run_code_unsafe,mcp__playwright__browser_wait_for", "max_results": 2}
  42. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const client = await page.context().newCDPSession(page);\n await client.send('Network.enable');\n await client …
  43. `mcp__playwright__browser_evaluate` {"function": "() => {\n const form = document.getElementById('booking-form');\n const field = (id) => document.getElementById(id);\n return  …
  44. `mcp__playwright__browser_click` {"target": "#calc-form button[type=\"submit\"]", "element": "кнопка «Рассчитать стоимость» в калькуляторе"}
  45. `mcp__playwright__browser_evaluate` {"function": "() => {\n const form = document.getElementById('booking-form');\n return JSON.stringify({\n state: form.dataset.state,\n snaps …
  46. `mcp__playwright__browser_click` {"target": "#booking-submit", "element": "кнопка «Отправить заявку»"}
  47. `mcp__playwright__browser_evaluate` {"function": "() => {\n const g = (id) => document.getElementById(id);\n return JSON.stringify({\n state: g('booking-form').dataset.state,\n …
  48. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/"}
  49. `mcp__playwright__browser_type` {"target": "#booking-name", "element": "поле «Имя»", "text": "Иван Петров"}
  50. `mcp__playwright__browser_evaluate` {"function": "() => {\n const g = (id) => document.getElementById(id);\n return JSON.stringify({\n nameError: g('booking-name-error').textCo …
  51. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n const submit = () => page.locator('#booking-submit').click();\n const read = (id) => page.lo …
  52. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.locator('#booking-name').fill('Иван Петров');\n await page.locator('#booking-phone').fill('+7 000 0 …
  53. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  54. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n // Повторяем путь до успеха на свежей странице, чтобы проверить правку стилей.\n await page.goto('http://local …
  55. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n const state = () => page.locator('#booking-form').getAttribute('data-state');\n const settle …
  56. `mcp__playwright__browser_console_messages` {"level": "error", "all": true}
  57. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.goto('http://localhost:8000/', { waitUntil: 'load' });\n await page.locator('#calc-form button[type …
  58. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n const settle = () => page.waitForFunction(\n () => document.getElementById('booking-form').d …
  59. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n await page.goto('http://localhost:8000/', { waitUntil: 'load' });\n\n // --- Сценарий 16: об …
  60. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.goto('http://localhost:8000/', { waitUntil: 'load' });\n await page.locator('#calc-form button[type …
  61. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.goto('http://localhost:8000/', { waitUntil: 'load' });\n\n // Сервер «молчит»: ответ держим дольше  …
  62. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.setViewportSize({ width: 360, height: 800 });\n await page.goto('http://localhost:8000/', { waitUnt …
  63. `Bash` ls -la /tmp/p5-playwright/*.png 2>/dev/null | awk '{print $5, $NF}'
  64. `Glob` /tmp/p5-playwright/*.png
  65. `Read` /tmp/p5-playwright/360-3-errors.png
- итог: success, 67 ходов, 974 с

Ответ агента:

You've hit your weekly limit · resets Oct 27, 2am (Europe/Moscow)

## Сессия `h7b-ui-impl` — КОМАНДА 1 — продолжение

Промпт:

```text
Тебя прервал лимит посреди /speckit-implement. Сервер снова запущен владельцем на http://localhost:8000/ — не останавливай его.
Сверь фактическое состояние файлов с specs/001-booking-ui/tasks.md, отметь [X] то, что уже реально сделано, и доведи оставшиеся задачи по прежнему заданию (код команды 2 не меняй, существующие тесты не меняй, check.sh зелёный, браузерные сценарии quickstart через MCP playwright на 360 и 1280, скриншоты только в /tmp/p5-playwright).
В конце: что сделано, результаты check.sh и браузерных сценариев, открытые вопросы.
```

- session_id: `b21e12b8-3ab5-4706-9fb6-ec1a955ab908`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (42):
  1. `Bash` sh scripts/check.sh 2>&1 | tail -8
  2. `Bash` ls -1 src/booking-text.js src/booking-form.js tests/booking-text.test.js tests/booking-form.test.js tests/booking-markup.test.js 2>&1; echo  …
  3. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/booking-form.js
  4. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  5. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  6. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  7. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  8. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  9. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/booking-form.test.js
  10. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/booking-text.js
  11. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  12. `Bash` echo "=== условия про коды/состояния/тексты в main.js (booking-часть) ==="; sed -n '200,520p' src/main.js | grep -nE "ERROR_CODES|'no-estima …
  13. `Bash` echo "=== цвета вне токенов во всём styles.css ==="; grep -nE "#[0-9a-fA-F]{3,8}|rgb|hsl" styles.css | grep -v "^\s*[0-9]*:\s*--" | head -20 …
  14. `Grep` #[0-9a-fA-F]{3,8}|rgb\(|hsl\(|box-shadow|gradient|animation:|transition:
  15. `Grep` var\(--stamp\)
  16. `Skill` landing-check
  17. `Bash` node .claude/skills/landing-check/scripts/audit.mjs index.html
  18. `Bash` sh scripts/check.sh 2>&1 | tail -6
  19. `ToolSearch` {"query": "select:mcp__contrast__check_contrast", "max_results": 1}
  20. `mcp__contrast__check_contrast` {"foreground": "--ink", "background": "--paper"}
  21. `mcp__contrast__check_contrast` {"foreground": "--ink-2", "background": "--paper"}
  22. `mcp__contrast__check_contrast` {"foreground": "--stamp", "background": "--paper"}
  23. `mcp__contrast__check_contrast` {"foreground": "--ink", "background": "--signal"}
  24. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n // Кэш страницы в этом профиле уже подводил: гасим его на время проверки.\n const client = a …
  25. `mcp__playwright__browser_console_messages` {"level": "error"}
  26. `Read` /tmp/p5-playwright/audit-booking-1280.png
  27. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  28. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.setViewportSize({ width: 1280, height: 900 });\n await page.goto('http://localhost:8000/', { waitUn …
  29. `Read` /tmp/p5-playwright/audit-booking-360.png
  30. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n const state = () => page.locator('#booking-form').getAttribute('data-state');\n const settle …
  31. `mcp__playwright__browser_console_messages` {"level": "error"}
  32. `Bash` python3 - <<'PY' import re p = 'specs/001-booking-ui/tasks.md' s = open(p, encoding='utf-8').read() done = [f'T{n:03d}' for n in range(1, 55 …
  33. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/tasks.md
  34. `Bash` grep -c "^- \[X\] T" specs/001-booking-ui/tasks.md; grep -c "^- \[ \] T" specs/001-booking-ui/tasks.md || echo "незакрытых нет"
  35. `Bash` sh scripts/check.sh 2>&1 | tail -7; echo "=== изменённые/новые файлы фичи ==="; git status --short -- . 2>/dev/null | head; echo "=== чужие  …
  36. `Bash` echo "=== чужие файлы (команда 2) ==="; ls -l --time-style=+%d.%m_%H:%M src/booking.js src/booking-store.js src/format.js src/calc.js src/ca …
  37. `Bash` stat -c '%y %n' src/booking.js src/booking-store.js src/format.js src/calc.js src/cars.js server.js scripts/check.sh package.json docs/requi …
  38. `Bash` ls -1 docs/; echo "=== png вне /tmp/p5-playwright ==="; find . -name '*.png' -not -path './node_modules/*' 2>/dev/null | head || true; echo  …
  39. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/contracts/ui-modules.md
  40. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/contracts/ui-modules.md
  41. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/contracts/ui-modules.md
  42. `Bash` sh scripts/check.sh 2>&1 | tail -6
- итог: success, 44 ходов, 355 с

Ответ агента:

Фича доведена. Все 54 задачи в `tasks.md` отмечены `[X]`.

## Что сделано

**Новые файлы (наши):**
- `src/booking-text.js` — `BOOKING_TEXT` (все видимые строки) + `errorView(code, field, context)`; объявляет `BOOKING_STATES` рядом с их русскими подписями.
- `src/booking-form.js` — `statePresentation`, `snapshotView`, `bookingPayload`, `checkDraft`, `conflictText`, `confirmationView`, `responseView`. Своей проверки полей нет: `checkDraft` вызывает `validateBooking` команды 2.
- `tests/booking-text.test.js`, `tests/booking-form.test.js`, `tests/booking-markup.test.js`.

**Изменены (наши):** `index.html` (секция `#booking` между `#calculator` и `#benefits`, ссылка в меню), `styles.css`, `src/main.js` (снимок расчёта, `applyState`, `fetch` с `AbortController` на 10 с).

**Чужое не тронуто** — по mtime: `src/booking.js`, `booking-store.js`, `server.js`, `format.js`, `calc.js`, `cars.js`, `package.json`, `scripts/check.sh`, `docs/` и все существующие тесты датированы 09–23.10, наши файлы 24–27.10. Сервер владельца не останавливал: «сервер недоступен» делал перехватом запроса (`route.abort`, `fulfill` 500, задержка 14 с).

## check.sh

**257/257 pass, 0 fail.** Было 174 до начала (с кодом команды 2) → +83 наших. Зелёный после каждой правки (hook `check-after-edit` ловил это автоматически; на нём же я поймал три своих теста, где сумма была записана обычным пробелом вместо NBSP из `formatPrice`).

## Браузерные сценарии (MCP playwright, 360 и 1280)

Все 16 сценариев quickstart плюс четыре сверх списка — пройдены на обеих ширинах:

| Проверка | Результат |
|---|---|
| 5 состояний, горизонтальный скролл | нет ни в одном (360 = 360, 1280 = 1280) |
| Высота касания на 360 | 44 px у полей, кнопки, ссылки |
| Три ошибки сразу, фокус на имени, запрос не ушёл | ✓ |
| Правка поля снимает только свою ошибку | ✓ |
| Тексты `name_charset`, `phone_invalid`, `date_past`, `date_too_far` (365 из `BOOKING_HORIZON_DAYS`), обе ветки `name_length` | дословно по §7 |
| Успех | `AD-0001`, модель, `10.11.2026`, срок, итог; телефона нет |
| Конфликт дат | «занята с 01.06.2027 по **03.06.2027**» — последний занятый день, не дата возврата |
| Встык (день возврата) | заявка проходит |
| Повтор идентичной заявки | тот же номер, второй брони нет (§9) |
| «Расчёт устарел» (отказ по `days`) | → `no-estimate`, значения сохранены |
| Таймаут | сработал на 10,9 с → `unavailable`, текст §7, значения на месте |
| Двойная отправка | 1 запрос к API, поля и кнопка недоступны |
| Клавиатура | имя → телефон → дата (3 нативных сегмента) → кнопка; Enter отправляет без перезагрузки |
| `error.message` сервера | не показан ни в одном сценарии |

**landing-check:** статический аудит 10/10 PASS, контраст `--ink` 12.72, `--ink-2` 5.01, `--stamp` 5.28, `--ink`/`--signal` 7.77 — все AA. Консоль чистая (единственная запись — Chromium логирует статус 409, это не ошибка JS). Отчёт в файл не писал, как ты просил.

## Три дефекта, найденных браузером (исправлены)

1. **Поля не исчезали после успеха** — `display: grid` у `.booking__fields` перебивал атрибут `hidden`. Добавил `.booking__fields[hidden] { display: none }`.
2. **Линии полей «Имя» и «Телефон» расходились** на 1280 — строки грида растягивались по высоте соседа (у телефона подсказка в две строки). Добавил `align-content: start`.
3. **`* — ` жило в CSS**, а «обязательное поле» в `BOOKING_TEXT` — строка собиралась из двух мест. Перенёс целиком в `BOOKING_TEXT.required`.

Отдельно: консольная ошибка `./format.js does not provide formatDate` оказалась **не дефектом кода** — в профиле браузера лежала устаревшая копия `/src/format.js` (199 байт против 647 на диске). Снял через CDP `Network.clearBrowserCache`.

## Открытые вопросы

1. **`--stamp` на общем сообщении формы.** Style guide: «`--stamp` — только ошибки ввода». Я покрасил им и `.booking__error` (ошибка поля, бесспорно), и `.booking__message`, где живут «Расчёт устарел…» и «Заявка не принята…». Второе — не ошибка конкретного поля. Обе формулировки просят исправить ввод, поэтому счёл в духе правила, но это судейское решение: скажи, если на приёмке нужен `--ink-2`.
2. **В `src/main.js` осталось три упоминания состояний** (T049): объявление `bookingState`, инвариант R-01 `estimate ? EDITING : NO_ESTIMATE` и защита от повторной отправки `=== SUBMITTING`. Ни одно не выбирает текст и не трактует код сервера — остальное я вынес в `statePresentation`. Если нужна буквальная нулевая отметка, инвариант тоже уедет в чистую функцию.
3. **Ветка `name_length` без длины.** Если сервер пришлёт `name_length`, а UI длину не знает, беру «слишком короткое». Практически недостижимо: UI проверяет тем же `validateBooking` до отправки.
4. **Хранилище в памяти** — у владельца уже накопились `AD-0001…` от моих прогонов; перезапуск сервера обнулит нумерацию. Ожидаемо по §11, но имей в виду при демонстрации.

Коммит не делал — по AGENTS.md его делаешь ты после приёмки.
