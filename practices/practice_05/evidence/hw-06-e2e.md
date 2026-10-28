# ДЗ. Сквозная проверка отдельным чатом

## Сессия `h8-e2e` — отдельный чат-проверяющий

Промпт:

```text
Ты независимый проверяющий (не автор кода). Прочитай общий контракт specs/contracts/booking-contract.md и обе спеки: specs/001-booking-ui/spec.md, specs/002-booking-api/spec.md.
Найди и запусти команду проверки проекта.
Сервер уже запущен владельцем: http://localhost:8000/ (node server.js, хранилище пустое) — не останавливай его.
Пройди СКВОЗНЫЕ сценарии через MCP playwright (1280 и 360 px), каждый от калькулятора до ответа сервера, и подтверди ответ сервера отдельно (curl GET /api/bookings/{id} или наблюдаемый network-запрос):
1) основной: расчёт → заявка → номер AD-… → GET по номеру возвращает те же данные и цену;
2) ошибка: невалидные поля (имя «1», телефон из 5 цифр) — запрос не уходит, тексты по §7;
3) граница: вторая заявка на ту же машину с пересечением дат → 409 и текст с последним занятым днём; заявка встык (день возврата) → проходит;
4) сервер недоступен (перехват запроса в браузере) → состояние unavailable, введённое сохранено;
5) старые сценарии: фильтр автопарка и калькулятор работают.
По каждому: ожидание → факт → доказательство. Скриншоты только в /tmp/p5-playwright/e2e. Файлы проекта не меняй. Не считай отчёты авторов самостоятельной проверкой.
```

- session_id: `c5b46667-db7b-42d3-becf-6dfc449b2491`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (119):
  1. `Bash` ls -R /home/kulakva/Documents/ITMOv2/practices/practice_05/project | head -100
  2. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/contracts/booking-contract.md
  3. `Bash` cat scripts/check.sh && cat package.json && wc -l specs/001-booking-ui/spec.md specs/002-booking-api/spec.md src/*.js server.js
  4. `Bash` sh scripts/check.sh 2>&1 | tail -30
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/booking-text.js
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/spec.md
  7. `Bash` mkdir -p /tmp/p5-playwright/e2e && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/ && curl -s http://localhost:8000/api/book …
  8. `Bash` mkdir -p /tmp/p5-playwright/e2e && echo ok
  9. `Bash` curl -s -o /dev/null -w "GET / -> %{http_code}\n" http://localhost:8000/; curl -s -w "\nGET AD-0001 -> %{http_code}\n" http://localhost:8000 …
  10. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_resize,mcp__playwright__browser_snapshot,mcp__playwright__brows …
  11. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  12. `mcp__playwright__browser_navigate` http://localhost:8000/
  13. `Bash` ls /tmp/p5-playwright/ && cat /tmp/p5-playwright/page-2026-10-26T23-29-37-907Z.yml
  14. `Read` /tmp/p5-playwright/page-2026-10-26T23-29-37-907Z.yml
  15. `mcp__playwright__browser_click` {"element": "checkbox «Детское кресло»", "target": "e187"}
  16. `mcp__playwright__browser_click` {"element": "checkbox «Полная страховка»", "target": "e195"}
  17. `mcp__playwright__browser_click` {"element": "кнопка «Рассчитать стоимость»", "target": "e198"}
  18. `mcp__playwright__browser_evaluate` {"function": "() => {\n const sec = document.querySelector('#booking');\n const calc = document.querySelector('#calculator');\n return {\n b …
  19. `mcp__playwright__browser_evaluate` {"function": "() => [...document.querySelectorAll('#booking input, #booking button, #booking [role=status], #booking [role=alert]')].map(el  …
  20. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#booking-name", "name": "Имя", "type": "textbox", "value": "1"}, {"target": "#booking-phone", "name": "Телефон", "ty …
  21. `mcp__playwright__browser_click` {"element": "кнопка «Отправить заявку»", "target": "#booking-submit"}
  22. `mcp__playwright__browser_evaluate` {"function": "() => {\n const g = id => document.getElementById(id);\n return {\n state: document.querySelector('#booking [data-state]').get …
  23. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/"}
  24. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s2-validation-1280.png", "target": "#booking", "element": "секция заявки с ошибками", "scale": "css"}
  25. `mcp__playwright__browser_type` {"element": "поле «Имя»", "target": "#booking-name", "text": "Иван Петров"}
  26. `mcp__playwright__browser_evaluate` {"function": "() => ({nameErr: document.getElementById('booking-name-error').textContent, nameInvalid: document.getElementById('booking-name …
  27. `mcp__playwright__browser_type` {"element": "поле «Телефон»", "target": "#booking-phone", "text": "+7 000 000-00-00"}
  28. `mcp__playwright__browser_click` {"element": "кнопка «Отправить заявку»", "target": "#booking-submit"}
  29. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), text: document.querySelector('#book …
  30. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/"}
  31. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s1-success-1280.png", "target": "#booking", "element": "подтверждение заявки", "scale": "css"}
  32. `Bash` curl -s -w "\nHTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0001
  33. `ToolSearch` {"query": "select:mcp__playwright__browser_network_request", "max_results": 1}
  34. `mcp__playwright__browser_network_request` {"index": 12, "part": "request-body"}
  35. `mcp__playwright__browser_click` {"element": "кнопка «Оформить ещё одну заявку»", "target": "#booking button"}
  36. `mcp__playwright__browser_click` {"element": "кнопка «Оформить ещё одну заявку»", "target": "#booking-again"}
  37. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), values: ['booking-name','booking-ph …
  38. `mcp__playwright__browser_click` {"element": "кнопка «Рассчитать стоимость»", "target": "#calculator button[type=submit], #calculator form button"}
  39. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#booking-name", "name": "Имя", "type": "textbox", "value": "Мария Орлова"}, {"target": "#booking-phone", "name": "Те …
  40. `mcp__playwright__browser_click` {"element": "кнопка «Отправить заявку»", "target": "#booking-submit"}
  41. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), dateErr: document.getElementById('b …
  42. `Read` /tmp/p5-playwright/console-2026-10-26T23-29-37-709Z.log
  43. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/"}
  44. `mcp__playwright__browser_network_request` {"index": 13, "part": "response-body"}
  45. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s3-conflict-409-1280.png", "target": "#booking", "element": "ошибка занятых дат", "scale": "css"}
  46. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#booking-date", "name": "Дата", "type": "textbox", "value": "2026-11-13"}]}
  47. `mcp__playwright__browser_click` {"element": "кнопка «Отправить заявку»", "target": "#booking-submit"}
  48. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), text: document.querySelector('#book …
  49. `Bash` curl -s -w "\nHTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0002
  50. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s3-abutting-ok-1280.png", "target": "#booking", "element": "заявка встык принята", "scale": "css"}
  51. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.route('**/api/bookings', route => route.abort('connectionrefused'));\n return 'route installed: POS …
  52. `mcp__playwright__browser_click` {"element": "кнопка «Оформить ещё одну заявку»", "target": "#booking-again"}
  53. `mcp__playwright__browser_click` {"element": "кнопка «Рассчитать стоимость»", "target": "#calculator form button"}
  54. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#booking-name", "name": "Имя", "type": "textbox", "value": "Пётр Семёнов"}, {"target": "#booking-phone", "name": "Те …
  55. `mcp__playwright__browser_click` {"element": "кнопка «Отправить заявку»", "target": "#booking-submit"}
  56. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), status: document.getElementById('bo …
  57. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s4-unavailable-1280.png", "target": "#booking", "element": "состояние сервер недоступен", "scale": "css …
  58. `Bash` curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0003
  59. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.unroute('**/api/bookings');\n return 'route removed';\n}"}
  60. `mcp__playwright__browser_click` {"element": "кнопка «Отправить заявку» (повтор)", "target": "#booking-submit"}
  61. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), text: document.querySelector('#book …
  62. `Bash` curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0003
  63. `mcp__playwright__browser_select_option` {"element": "фильтр «Класс»", "target": "e37", "values": ["эконом"]}
  64. `mcp__playwright__browser_select_option` {"element": "фильтр «Коробка»", "target": "e40", "values": ["автомат"]}
  65. `mcp__playwright__browser_evaluate` {"function": "() => {\n const fleet = document.querySelector('#fleet');\n const cards = [...fleet.querySelectorAll('article')].filter(a => a …
  66. `mcp__playwright__browser_select_option` {"element": "фильтр «Класс»", "target": "e37", "values": ["бизнес"]}
  67. `mcp__playwright__browser_select_option` {"element": "фильтр «Коробка»", "target": "e40", "values": ["механика"]}
  68. `mcp__playwright__browser_evaluate` {"function": "() => {\n const fleet = document.querySelector('#fleet');\n const cards = [...fleet.querySelectorAll('article')].filter(a => a …
  69. `Bash` cat openspec/specs/fleet-filtering/spec.md
  70. `mcp__playwright__browser_evaluate` {"function": "() => {\n const fleet = document.querySelector('#fleet');\n const head = fleet.querySelector('[aria-hidden]');\n return {fleet …
  71. `mcp__playwright__browser_select_option` {"element": "фильтр «Класс»", "target": "e37", "values": ["внедорожник"]}
  72. `mcp__playwright__browser_evaluate` {"function": "() => {\n const fleet = document.querySelector('#fleet');\n const cards = [...fleet.querySelectorAll('article')].filter(a => a …
  73. `mcp__playwright__browser_click` {"element": "кнопка «Рассчитать» у Тайга Лифт", "target": "#fleet article:visible button"}
  74. `mcp__playwright__browser_evaluate` {"function": "() => {\n const sel = document.querySelector('#calculator select');\n const statuses = [...document.querySelectorAll('#fleet [ …
  75. `Grep` selected|current|aria-current
  76. `Grep` car--|is-selected|dataset.selected|setAttribute\('aria-current'|classList
  77. `Grep` chosen|выбран|Выбрана
  78. `mcp__playwright__browser_evaluate` {"function": "() => [...document.querySelectorAll('#fleet [data-car-id]')].map(a=>({id:a.dataset.carId, chosen:a.dataset.chosen ?? null, vis …
  79. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#calculator input[type=number]", "name": "Срок", "type": "textbox", "value": "7"}]}
  80. `mcp__playwright__browser_click` {"element": "кнопка «Рассчитать стоимость»", "target": "#calculator form button"}
  81. `Bash` node -e "import('./src/calc.js').then(m=>console.log(JSON.stringify(m.calculateRental({carId:'taiga-lift',days:7,extras:['child-seat','full- …
  82. `mcp__playwright__browser_evaluate` {"function": "() => ({calc: document.querySelector('#calculator').innerText.split('Рассчитать стоимость')[1], snapshot: document.querySelect …
  83. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s5-filter-calc-1280.png", "fullPage": true, "scale": "css"}
  84. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#booking-name", "name": "Имя", "type": "textbox", "value": "Анна Соколова"}, {"target": "#booking-phone", "name": "Т …
  85. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#calculator input[type=number]", "name": "Срок", "type": "textbox", "value": "5"}]}
  86. `mcp__playwright__browser_evaluate` {"function": "() => ({state: document.querySelector('#booking [data-state]').getAttribute('data-state'), values: ['booking-name','booking-ph …
  87. `mcp__playwright__browser_resize` {"width": 360, "height": 740}
  88. `mcp__playwright__browser_navigate` http://localhost:8000/
  89. `mcp__playwright__browser_evaluate` {"function": "() => {\n const d = document.documentElement;\n const h = el => el ? Math.round(el.getBoundingClientRect().height) : null;\n r …
  90. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = [];\n const read = async () => await page.evaluate(() => {\n const fleet = document.querySelector( …
  91. `mcp__playwright__browser_evaluate` {"function": "() => [...document.querySelectorAll('#fleet select')].map(s=>({id:s.id, value:s.value, options:[...s.options].map(o=>o.value)} …
  92. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = [];\n const read = async () => await page.evaluate(() => {\n const fleet = document.querySelector( …
  93. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.locator('#calculator select').selectOption('mirta-20');\n await page.locator('#calculator input[typ …
  94. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.locator('#booking-name').fill('1');\n await page.locator('#booking-phone').fill('12345');\n await p …
  95. `mcp__playwright__browser_evaluate` {"function": "() => ({snapshot: document.querySelector('#booking').innerText.split('Из расчёта выше')[1]?.split('Имя')[0], hasTotal: /15\\s2 …
  96. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/"}
  97. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s2-validation-360.png", "target": "#booking", "element": "ошибки полей на 360", "scale": "css"}
  98. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.locator('#booking-name').fill('Ольга Зимина');\n await page.locator('#booking-phone').fill('8 000 2 …
  99. `Bash` curl -s -w "\nHTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0004
  100. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s1-success-360.png", "target": "#booking", "element": "подтверждение на 360", "scale": "css"}
  101. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n const out = {};\n const recalc = async () => {\n await page.locator('#booking-again').click();\n await page.lo …
  102. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/"}
  103. `mcp__playwright__browser_network_request` {"index": 13, "part": "response-body"}
  104. `Bash` curl -s -w "\nHTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0005
  105. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.route('**/api/bookings', route => route.abort('connectionrefused'));\n await page.locator('#booking …
  106. `mcp__playwright__browser_take_screenshot` {"filename": "/tmp/p5-playwright/e2e/s4-unavailable-360.png", "target": "#booking", "element": "сервер недоступен на 360", "scale": "css"}
  107. `Bash` curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0006
  108. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.unroute('**/api/bookings');\n await page.locator('#booking-submit').click();\n await page.waitForTi …
  109. `Bash` curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0006; curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bo …
  110. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n // state no-estimate + calculator + fleet at 360 for the record\n await page.locator('#booking-again').click() …
  111. `mcp__playwright__browser_network_requests` {"static": false, "filter": "/api/bookings"}
  112. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.locator('#booking-again').click();\n await page.locator('#calculator select').selectOption('nordkap …
  113. `Bash` curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0007; curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bo …
  114. `Bash` curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0007; curl -s -w " HTTP %{http_code}\n" http://localhost:8000/api/bo …
  115. `Glob` /tmp/p5-playwright/e2e/*.png
  116. `mcp__playwright__browser_run_code_unsafe` {"code": "async (page) => {\n await page.locator('#booking-date').fill('2027-03-07');\n await page.locator('#booking-submit').click();\n awa …
  117. `Bash` curl -s -w "\nHTTP %{http_code}\n" http://localhost:8000/api/bookings/AD-0008; git status --porcelain
  118. `Bash` find /home/kulakva/Documents/ITMOv2/practices/practice_05/evidence -maxdepth 2 -newermt '-60 minutes' | head -20
  119. `Glob` /home/kulakva/Documents/ITMOv2/practices/practice_05/evidence/**
- итог: success, 120 ходов, 552 с

Ответ агента:

Проверка завершена. Файлы проекта не менялись (`git status` — только те же untracked каталоги, что были на старте; скриншоты только в `/tmp/p5-playwright/e2e`).

## Команда проверки

`sh scripts/check.sh` (из `AGENTS.md` и `package.json` → `scripts.test`). Запущена: **257 тестов, 0 падений**. Сервер владельца на `:8000` не трогал.

Базовое состояние подтверждено независимо: `GET /api/bookings/AD-0001` → `404 booking_not_found`, т.е. хранилище было пустым до начала.

---

## 1) Основной сценарий: расчёт → заявка → номер → GET

**Ожидание** (§4, §5, FR-017): форма из `no-estimate` переходит в `editing` при расчёте, снимок повторяет итог калькулятора, запрос содержит ровно шесть полей, ответ `201`, в подтверждении номер/машина/дата `ДД.ММ.ГГГГ`/срок/`price.total` без телефона, `GET` по номеру отдаёт то же.

**Факт — 1280 px:** `data-state` при загрузке `no-estimate`, поля `disabled`; после расчёта `editing`, снимок «Ларус 1.6 / 3 сут. / Детское кресло, Полная страховка / 9 180 ₽» = итог калькулятора `9 180 ₽`. Отправка → `success`, текст: `AD-0001 · Ларус 1.6 · 10.11.2026 · 3 сут. · 9 180 ₽`, телефона в подтверждении нет.

**Доказательство:**
- тело запроса из network: `{"carId":"larus-16","days":3,"extras":["child-seat","full-insurance"],"name":"Иван Петров","phone":"+7 000 000-00-00","startDate":"2026-11-10"}` — ни сумм, ни `endDate`, ни статуса; телефон как введён;
- `POST /api/bookings => [201]`;
- `curl GET /api/bookings/AD-0001` → `200`, `startDate 2026-11-10`, `endDate 2026-11-13`, `days 3`, `extras ["child-seat","full-insurance"]`, `price.total 9180` — совпадает с показанным `9 180 ₽`; `customer.phone` нормализован в `+70000000000`;
- `/tmp/p5-playwright/e2e/s1-success-1280.png`.

**Факт — 360 px:** то же на `mirta-20`, 4 сут., без опций → `AD-0004`, `15 200 ₽`, дата `10.01.2027`. `curl GET /api/bookings/AD-0004` → `200`, `total 15200`, `endDate 2027-01-14`, телефон `8 000 222-33-44` → `+70002223344` (ведущая `8` принята по §6). Скриншот `s1-success-360.png`.

Дополнительно проверено: двойное нажатие кнопки (360 px) — во время отправки `data-state=submitting`, кнопка `disabled` с подписью «Отправляем заявку…», все три поля `disabled`; второй клик второго запроса не дал — на 6 нажатий ровно 6 POST, создалась одна бронь `AD-0007`, `AD-0008` на тот момент → `404`.

---

## 2) Ошибка: имя «1», телефон из 5 цифр — запрос не уходит

**Ожидание** (§7, FR-021…FR-023): обе ошибки сразу, тексты строго из каталога, `aria-invalid="true"`, фокус на первом ошибочном поле, запрос не отправляется, введённое и снимок сохранены.

**Факт (1280 и 360 — одинаково):**
- имя: `Имя слишком короткое — не меньше 2 символов.` (ветка «короткое» выбрана UI по длине 1 — как требует §7);
- телефон: `Телефон должен содержать 11 цифр, например +7 000 000-00-00.`;
- у даты ошибки нет, `aria-invalid` отсутствует — ошибки не перетекают между полями;
- `aria-invalid="true"` на обоих полях, контейнеры ошибок `role="alert"`, поля связаны через `aria-describedby="…-hint …-error"`;
- `document.activeElement` = `booking-name`;
- значения `["1","12345","2026-11-10"]` сохранены, снимок расчёта на месте;
- состояние осталось `editing`.

**Доказательство:** список network-запросов с фильтром `/api/` — **пусто** (0 запросов), при этом статические 11 запросов видны, т.е. перехват работает. Скриншоты `s2-validation-1280.png`, `s2-validation-360.png`.

Отдельно проверено FR-022: после исправления только имени его ошибка и `aria-invalid` снялись, ошибка телефона осталась.

---

## 3) Граница: пересечение → 409, встык → проходит

**Ожидание** (§8, FR-025): при пересечении — `409 date_conflict` с `conflict`, у поля даты текст с **последним занятым днём** = `addDays(conflict.endDate, -1)`; заявка на день возврата проходит; отклонённая заявка номер не расходует.

**Факт — 1280 px:** `AD-0001` занял `[2026-11-10, 2026-11-13)`. Вторая заявка на тот же `larus-16` с 12.11.2026 (другое имя/телефон, чтобы не сработало правило §9) → `editing`, у поля даты:
`Эта машина занята с 10.11.2026 по 12.11.2026. Выберите другую дату начала или другую машину.` — последний занятый день 12.11, не 13.11. `aria-invalid="true"`, фокус на поле даты, имя и телефон сохранены.
Затем дата 13.11.2026 (день возврата) → `success`, `AD-0002`.

**Доказательство:**
- `POST /api/bookings => [409]`, тело: `conflict: {"carId":"larus-16","startDate":"2026-11-10","endDate":"2026-11-13"}`; человеческое `error.message` сервера («…Выберите другие даты…») на экране **не появилось** — UI показал свою формулировку из `booking-text.js`;
- `curl GET /api/bookings/AD-0002` → `200`, `startDate 2027-…` → фактически `2026-11-13`, `endDate 2026-11-16`;
- нумерация: после отказа выдан `AD-0002`, а не `AD-0003` — номер не израсходован;
- `s3-conflict-409-1280.png`, `s3-abutting-ok-1280.png`.

**Факт — 360 px:** `AD-0004` занял `[2027-01-10, 2027-01-14)`. Заявка с 13.01.2027 → `409`, текст `…занята с 10.01.2027 по 13.01.2027…` (граница сдвинулась вместе со сроком — значит день считается, а не прошит). Заявка с 14.01.2027 → `AD-0005`, `curl GET` → `200`, `startDate 2027-01-14`, `endDate 2027-01-18`. Скриншоты `s3-conflict-409-360.png`, `s3-abutting-ok-360.png`.

Повторно на другой машине (360 px): `nordkap-4x4` занят `[2027-03-05, 2027-03-07)` → заявка с 06.03 даёт `…с 05.03.2027 по 06.03.2027…`, заявка с 07.03 проходит → `AD-0008`, подтверждена `curl`.

---

## 4) Сервер недоступен (перехват в браузере)

**Ожидание** (§7 последняя строка, §10, FR-019): состояние `unavailable`, текст «Заявка не отправлена — сервер не ответил…», всё введённое сохранено, повтор возможен и второй брони не создаёт.

**Факт (1280 и 360):** `page.route('**/api/bookings', abort('connectionrefused'))` →
- `data-state="unavailable"`;
- `#booking-status` (`role="status"`): `Заявка не отправлена — сервер не ответил. Проверьте связь и нажмите «Отправить заявку» ещё раз.` — дословно §7;
- значения сохранены (1280: `Пётр Семёнов / +7 (000) 555-44-33 / 2026-12-01`; 360: `Дарья Крылова / +7 000 404-50-60 / 2027-02-20`), снимок расчёта на месте, кнопка и поля снова активны.

**Доказательство:** network показывает `POST /api/bookings => [FAILED] net::ERR_CONNECTION_REFUSED`; `curl GET /api/bookings/AD-0003` (и позже `AD-0006`) в этот момент → `404 booking_not_found`, т.е. брони действительно нет. После снятия перехвата то же нажатие дало `201` и `curl GET /api/bookings/AD-0003` / `AD-0006` → `200` с ровно теми данными; следующий номер остался свободным (`AD-0007` → `404`). Скриншоты `s4-unavailable-1280.png`, `s4-unavailable-360.png`.

---

## 5) Старые сценарии

**Фильтр автопарка** — работает на обеих ширинах:

| выбор | счётчик | показано |
|---|---|---|
| любой + любая | Показано 8 из 8 | все 8 в исходном порядке |
| эконом + автомат | Показано 1 из 8 | Корда Мини |
| бизнес + любая | Показано 2 из 8 | Прима Седан, Прима Лонг |
| бизнес + механика | Показано 0 из 8 | — |
| внедорожник + механика | Показано 1 из 8 | Тайга Лифт |

Пустой результат: строка `Под эти условия машин нет — выберите «Любой класс» или «Любая коробка»`, шапка реестра скрыта; выход из пустого результата возвращает машины. Связка с калькулятором: «Рассчитать» у Тайга Лифт → в калькуляторе выбран `taiga-lift`, отметка `data-chosen="true"` на её карточке, отдельная область `role="status"` — «Выбрана Тайга Лифт — 4 300 ₽ за сутки.», при этом список машин в калькуляторе остался полным (8 опций) и от фильтра не зависит.

**Калькулятор** — цифры сошлись с `calculateRental` точно: Тайга Лифт, 7 сут., кресло + страховка → на экране `30 100 / −3 010 (10 %) / 2 100 / 4 064 / итого 33 254 / залог 25 000`; `node -e` на `src/calc.js` даёт `{base:30100, discount:3010, extrasTotal:2100, insurance:4064, total:33254, deposit:25000}`. Снимок в заявке повторил `33 254 ₽`.

**Сброс расчёта (FR-015):** после правки срока в калькуляторе форма вернулась в `no-estimate`, а имя, телефон и дата (`Анна Соколова / +7 000 777-88-99 / 2026-12-20`) сохранились. «Оформить ещё одну заявку» возвращает `no-estimate` с пустыми полями.

**Адаптивность:** на 1280 px `scrollWidth == clientWidth == 1280`; на 360 px `scrollWidth == clientWidth == 360` во всех пройденных состояниях (`no-estimate`, `editing` с ошибками, `submitting`, `success`, `unavailable`) — горизонтальной прокрутки нет. Высота касания на 360 px: поля, кнопка и ссылка на калькулятор — ровно 44 px. Границы поля даты заданы данными, а не разметкой: `min="2026-10-26"` (сегодня UTC), `max="2027-10-26"` = +365 суток.

---

## Итог

Все пять сценариев проходят на 1280 и 360 px; каждая заявка подтверждена отдельно либо `curl GET /api/bookings/{id}`, либо телом network-ответа. Расхождений с контрактом и спеками не нашёл.

Что осталось непокрытым моей проверкой (не входило в заданные сценарии, поэтому не считаю это ни «пройдено», ни «провалено»): строки §7 для `name_charset`, `date_past`, `date_too_far`, обеих ветвей `name_length` «слишком длинное», ветка `date_conflict` без читаемого `conflict`, общее сообщение «Заявка не принята…» для транспортных 4xx и переход в `no-estimate` по отказу сервера на `carId`/`days`/`extras` (§7, FR-043). Эти пути заявлены покрытыми юнит-тестами — в составе 257 зелёных — но через браузер я их не воспроизводил. Также не проверял контраст и полный проход клавиатурой (SC-005, SC-007).

Один артефакт, который может насторожить при просмотре логов: в консоли браузера есть записи `Failed to load resource: … 409 (Conflict)` и `ERR_CONNECTION_REFUSED`. Это штатное сообщение самого Chrome о статусе сети, а не ошибка JS страницы — других записей в консоли нет.
