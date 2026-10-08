# Фича B в worktree и ревью субагентом tester

Промпт студента: «Реализуй фичу B по требованиям проекта. Прочитай AGENTS.md и docs/style-guide.md. Сохрани сценарии A. → Вызови субагента tester … → Исправь две проблемы ревью.»

## Сессия `06-feature-b`
- session_id: `27cd8088-6875-466c-8006-92c8aa8363f3`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- субагент `tester` в списке агентов
- вызовы инструментов (61):
  1. `Read` <worktree-B>/docs/requirements.md
  2. `Read` <worktree-B>/docs/style-guide.md
  3. `Bash` find . -path ./.git -prune -o -type f -print | sort && echo "--- check.sh ---" && cat scripts/check.sh
  4. `Read` <worktree-B>/index.html
  5. `Read` <worktree-B>/src/main.js
  6. `Read` <worktree-B>/src/render.js
  7. `Read` <worktree-B>/src/format.js
  8. `Read` <worktree-B>/src/cars.js
  9. `Read` <worktree-B>/tests/index.test.js
  10. `Read` <worktree-B>/styles.css
  11. `Write` <worktree-B>/tests/calc.test.js
  12. `Bash` node --test "tests/calc.test.js" 2>&1 | head -25
  13. `Write` <worktree-B>/src/calc.js
  14. `Read` <worktree-B>/tests/render.test.js
  15. `Edit` <worktree-B>/src/render.js
  16. `Edit` <worktree-B>/src/render.js
  17. `Edit` <worktree-B>/tests/render.test.js
  18. `Edit` <worktree-B>/tests/render.test.js
  19. `Edit` <worktree-B>/index.html
  20. `Edit` <worktree-B>/index.html
  21. `Write` <worktree-B>/src/main.js
  22. `Edit` <worktree-B>/styles.css
  23. `Edit` <worktree-B>/styles.css
  24. `Edit` <worktree-B>/styles.css
  25. `Edit` <worktree-B>/tests/index.test.js
  26. `Edit` <worktree-B>/tests/index.test.js
  27. `Edit` <worktree-B>/tests/index.test.js
  28. `Bash` sh scripts/check.sh 2>&1 | tail -12
  29. `Bash` (curl -s -o /dev/null -w "8001 already up: %{http_code}\n" http://localhost:8001/ 2>/dev/null) || echo "8001 not responding"
  30. `Bash` curl -s -o /dev/null -w "%{http_code}\n" --max-time 3 http://localhost:8001/
  31. `Bash` python3 -m http.server 8001 --bind 127.0.0.1
  32. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_resize,mcp__playwright__browser_snapshot,mcp__playwright__brows …
  33. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  34. `mcp__playwright__browser_navigate` http://localhost:8001/
  35. `mcp__playwright__browser_snapshot` {"target": "#calculator"}
  36. `mcp__playwright__browser_fill_form` {"fields": [{"target": "#calc-car", "name": "Автомобиль", "type": "combobox", "value": "Мирта 2.0 — 3 800 ₽ / сут"}, {"target": "#calc-days" …
  37. `mcp__playwright__browser_click` {"target": "#calc-form button[type=submit]", "element": "кнопка «Рассчитать стоимость»"}
  38. `mcp__playwright__browser_evaluate` {"function": "() => ({\n result: document.getElementById('calc-result').innerText,\n error: document.getElementById('calc-error').innerText, …
  39. `mcp__playwright__browser_take_screenshot` {"target": "#calculator", "element": "секция калькулятора", "filename": "/tmp/p4b-calc-1280.png", "scale": "css"}
  40. `mcp__playwright__browser_take_screenshot` {"target": "#calculator", "element": "секция калькулятора", "filename": "/tmp/p4-playwright/calc-1280.png", "scale": "css"}
  41. `Read` /tmp/p4-playwright/calc-1280.png
  42. `mcp__playwright__browser_evaluate` {"function": "async () => {\n const form = document.getElementById('calc-form');\n const days = document.getElementById('calc-days');\n cons …
  43. `Edit` <worktree-B>/src/main.js
  44. `mcp__playwright__browser_navigate` http://localhost:8001/
  45. `mcp__playwright__browser_type` {"target": "#calc-days", "element": "поле «Срок, суток»", "text": "2.5", "submit": true}
  46. `mcp__playwright__browser_take_screenshot` {"target": "#calculator", "element": "калькулятор с ошибкой ввода", "filename": "/tmp/p4-playwright/calc-error-1280.png", "scale": "css"}
  47. `Read` /tmp/p4-playwright/calc-error-1280.png
  48. `mcp__playwright__browser_click` {"target": "[data-calc-for='prima-long']", "element": "кнопка «Рассчитать» у Прима Лонг"}
  49. `mcp__playwright__browser_evaluate` {"function": "() => {\n const calc = document.getElementById('calculator').getBoundingClientRect();\n return {\n selectValue: document.getEl …
  50. `mcp__playwright__browser_resize` {"width": 360, "height": 780}
  51. `mcp__playwright__browser_navigate` http://localhost:8001/
  52. `mcp__playwright__browser_evaluate` {"function": "async () => {\n const form = document.getElementById('calc-form');\n const car = document.getElementById('calc-car');\n const  …
  53. `mcp__playwright__browser_take_screenshot` {"target": "#calculator", "element": "калькулятор на 360 px", "filename": "/tmp/p4-playwright/calc-360.png", "scale": "css"}
  54. `Read` /tmp/p4-playwright/calc-360.png
  55. `mcp__playwright__browser_click` {"target": "[data-calc-for='korda-mini']", "element": "кнопка «Рассчитать» у Корда Мини (360 px)"}
  56. `mcp__playwright__browser_evaluate` {"function": "async () => {\n const doc = document.documentElement;\n const calc = document.getElementById('calculator').getBoundingClientRe …
  57. `mcp__playwright__browser_console_messages` {"level": "warning", "all": true}
  58. `mcp__playwright__browser_evaluate` {"function": "() => {\n const anchors = [...document.querySelectorAll('.nav a, .logo, a[href^=\"#\"]')].map((a) => a.getAttribute('href'));\ …
  59. `Bash` sh scripts/check.sh 2>&1 | tail -9; echo "=== git status --short ==="; git status --short
  60. `Read` /home/kulakva/.claude/projects/-home-kulakva-Documents-ITMOv2/memory/itmo-practice4-progress.md
  61. `Edit` /home/kulakva/.claude/projects/-home-kulakva-Documents-ITMOv2/memory/itmo-practice4-progress.md
- ответы hook (из --debug-file, по одному на запуск; подряд одинаковые схлопнуты в ×N):
  - check-after-edit: FAIL после правки <worktree-B>/tests/calc.test.js — ℹ tests 25 ℹ pass 24 ℹ fail 1
  - check-after-edit: PASS — ℹ tests 47 ℹ pass 47 ℹ fail 0 ×4
  - check-after-edit: PASS — ℹ tests 54 ℹ pass 54 ℹ fail 0
  - check-after-edit: FAIL после правки <worktree-B>/index.html — ℹ tests 54 ℹ pass 53 ℹ fail 1
  - check-after-edit: PASS — ℹ tests 54 ℹ pass 54 ℹ fail 0 ×6
  - check-after-edit: PASS — ℹ tests 60 ℹ pass 60 ℹ fail 0 ×3

Итог сессии (62 ходов):

> Фича B готова. Коммит не делал.
> 
> ## Что сделано
> 
> **Сначала тесты, потом код.** `tests/calc.test.js` написан до реализации и падал с `ERR_MODULE_NOT_FOUND: src/calc.js` (0 pass / 1 fail) — красный зафиксирован. Покрыто: обычный расчёт, обе границы скидки (6/7 и 13/14), верхняя граница 30, опции за сутки, страховка 15 % от базы после скидки, округление до рубля, залоги по классам, инвариант `total = base − discount + extras + insurance`, и все ошибочные входы (нецелые, вне 1–30, не-число, неизвестный `carId`, неизвестная опция, `extras` не массив).
> 
> **Реализация:** `src/calc.js` — чистая `calculateRental`, бросает `RangeError` с текстом, который говорит, что исправить. Разметка калькулятора — чистые функции в `src/render.js` (`carOptionsHtml`, `extrasFieldsHtml`, `receiptHtml`), секция `#calculator` между `#fleet` и `#benefits`, ссылка в меню. По стайлгайду: добавлен только токен `--stamp` для ошибки, волосяные линии вместо карточек, `tabular-nums`, суммы через `formatPrice`, ошибка с `role="alert"`, анимации нет.
> 
> ## Проверки в браузере (localhost:8001)
> 
> | Сценарий | 1280 | 360 |
> |---|---|---|
> | Обычный расчёт | Мирта 2.0, 7 сут., кресло + страховка → 26 600 − 2 660 + 2 100 + 3 591 = **29 631 ₽**, залог 15 000 ₽ | Тайга Лифт, 7 сут., страховка → **31 154 ₽** (совпадает с тестом на округление: 4 063,5 → 4 064) |
> | 0 суток | «Срок аренды — целое число суток от 1 до 30. Получено: 0.», итога нет | то же |
> | 31 сутки | то же с «Получено: 31.», итога нет | то же |
> | 2.5 суток | то же с «Получено: 2.5.», итога нет (проверено реальным вводом с клавиатуры) | то же |
> | «Рассчитать» в автопарке | Прима Лонг → выбрана в select, строка помечена (ровно одна), прокрутка к `#calculator`, фокус на поле | Корда Мини → то же |
> | Горизонтальный скролл | 0 px | 0 px, ни один элемент не выходит за вьюпорт |
> 
> Цвет ошибки — `rgb(180, 52, 42)` = `--stamp`, консоль чистая (0 ошибок, 0 предупреждений).
> 
> **Сценарии A сохранены:** один `h1`, 8 строк автопарка, все 6 пунктов меню ведут на существующие `id` (включая `#calculator`), внешних ресурсов нет.
> 
> ## Результат
> 
> ```
> sh scripts/check.sh → tests 60, pass 60, fail 0
> ```
> 
> ```
>  M index.html
>  M src/main.js
>  M src/render.js
>  M styles.css
>  M tests/index.test.js
>  M tests/render.test.js
> ?? src/calc.js
> ?? tests/calc.test.js
> ```
> 
> Одно отступление от буквального контракта: для пустого поля срока сообщение формирует UI («Укажите срок аренды — целое число суток от 1 до 30»), а не `calculateRental`, — иначе пользователь видел бы «Получено: NaN». Сама функция на `NaN` по-прежнему бросает `RangeError`, это покрыто тестом.

## Сессия `07-review-b`
- session_id: `cec245e3-0081-42e7-a409-79b1140a7b4d`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- субагент `tester` в списке агентов
- вызовы инструментов (57):
  1. `Agent` tester
  2. `Read` <worktree-B>/docs/requirements.md
  3. `Read` <worktree-B>/docs/style-guide.md
  4. `Read` <worktree-B>/src/calc.js
  5. `Read` <worktree-B>/tests/calc.test.js
  6. `Bash` git diff --stat && echo "---" && git status --short
  7. `Bash` git diff -- index.html src/main.js src/render.js
  8. `Bash` git diff -- styles.css tests/
  9. `Bash` sh scripts/check.sh 2>&1 | tail -40
  10. `Read` <worktree-B>/scripts/check.sh
  11. `Read` <worktree-B>/src/cars.js
  12. `Bash` curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8001/ ; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8001/src/calc.js
  13. `mcp__playwright__browser_navigate` http://localhost:8001/
  14. `mcp__playwright__browser_find` {"text": "Сколько выйдет аренда"}
  15. `mcp__playwright__browser_snapshot` {"target": "#calculator"}
  16. `mcp__playwright__browser_click` {"target": "e189", "element": "Кнопка Рассчитать стоимость"}
  17. `mcp__playwright__browser_evaluate` {"function": "() => ({ result: document.getElementById('calc-result').innerText, error: document.getElementById('calc-error').innerText })"}
  18. `mcp__playwright__browser_select_option` {"target": "#calc-car", "values": ["mirta-20"], "element": "Выбор автомобиля"}
  19. `mcp__playwright__browser_fill_form` {"fields": [{"name": "Срок", "target": "#calc-days", "type": "textbox", "value": "14"}, {"name": "Детское кресло", "target": "input[value=\" …
  20. `mcp__playwright__browser_click` {"target": "#calc-form button[type=\"submit\"]", "element": "Кнопка Рассчитать стоимость"}
  21. `mcp__playwright__browser_evaluate` {"function": "() => ({ car: document.getElementById('calc-car').value, days: document.getElementById('calc-days').value, result: document.ge …
  22. `mcp__playwright__browser_evaluate` {"function": "async () => {\n const days = document.getElementById('calc-days');\n const form = document.getElementById('calc-form');\n cons …
  23. `mcp__playwright__browser_find` {"text": "Тайга Лифт"}
  24. `mcp__playwright__browser_click` {"target": "[data-car-id=\"taiga-lift\"] button", "element": "Кнопка Рассчитать в карточке Тайга Лифт"}
  25. `mcp__playwright__browser_evaluate` {"function": "() => {\n const calc = document.getElementById('calculator').getBoundingClientRect();\n return {\n carValue: document.getEleme …
  26. `mcp__playwright__browser_evaluate` {"function": "() => ({ scrollY: Math.round(scrollY), calcTop: Math.round(document.getElementById('calculator').getBoundingClientRect().top), …
  27. `mcp__playwright__browser_navigate` http://localhost:8001/
  28. `mcp__playwright__browser_click` {"target": "[data-car-id=\"prima-long\"] button", "element": "Кнопка Рассчитать в карточке Прима Лонг"}
  29. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-after-card-click.png"}
  30. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/after-card-click.png"}
  31. `Read` /tmp/p4-playwright/after-card-click.png
  32. `mcp__playwright__browser_resize` {"width": 360, "height": 720}
  33. `mcp__playwright__browser_fill_form` {"fields": [{"name": "Срок", "target": "#calc-days", "type": "textbox", "value": "30"}, {"name": "Полная страховка", "target": "input[value= …
  34. `mcp__playwright__browser_click` {"target": "#calc-form button[type=\"submit\"]", "element": "Кнопка Рассчитать стоимость"}
  35. `mcp__playwright__browser_evaluate` {"function": "() => ({ hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth, sw: document.documentElement.sc …
  36. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/calc-360.png"}
  37. `Read` /tmp/p4-playwright/calc-360.png
  38. `Grep` {"pattern": "\\.button", "path": "<worktree-B>/styles.css", "output_mode": "content", " …
  39. `mcp__playwright__browser_console_messages` {"level": "warning", "all": true}
  40. `mcp__playwright__browser_resize` {"width": 1280, "height": 720}
  41. `mcp__playwright__browser_evaluate` {"target": "#calc-days", "element": "Поле срока", "function": "(el) => { el.focus(); el.select(); }"}
  42. `mcp__playwright__browser_type` {"target": "#calc-days", "element": "Поле срока", "text": "abc", "slowly": true}
  43. `mcp__playwright__browser_press_key` {"key": "Enter"}
  44. `mcp__playwright__browser_evaluate` {"function": "() => ({ raw: document.getElementById('calc-days').value, error: document.getElementById('calc-error').innerText, result: docu …
  45. `mcp__playwright__browser_click` {"target": "nav a[href=\"#calculator\"]", "element": "Ссылка меню Расчёт"}
  46. `mcp__playwright__browser_evaluate` {"function": "() => ({ hash: location.hash, calcTop: Math.round(document.getElementById('calculator').getBoundingClientRect().top), h1: docu …
  47. `mcp__playwright__browser_evaluate` {"function": "() => {\n const lum = (rgb) => { const [r,g,b] = rgb.match(/\\d+/g).map(Number).map(v=>{v/=255; return v<=0.03928? v/12.92 : M …
  48. `Grep` {"pattern": "reduced-motion|scroll-behavior", "path": "<worktree-B>/styles.css", "outpu …
  49. `mcp__playwright__browser_evaluate` {"function": "() => {\n const sel = document.getElementById('calc-car');\n const opt = document.createElement('option'); opt.value='ghost-ca …
  50. `mcp__playwright__browser_console_messages` {"level": "warning", "all": true}
  51. `mcp__playwright__browser_evaluate` {"function": "() => ['.extra__hint','#calc-car','.receipt__value','#calc-days'].map(s=>({s, fvn:getComputedStyle(document.querySelector(s)). …
  52. `mcp__playwright__browser_evaluate` {"function": "() => ['.extra__hint','#calc-car','#calc-days','.calc__result','.button'].map(s=>{const el=document.querySelector(s); if(!el)  …
  53. `mcp__playwright__browser_evaluate` {"function": "() => {\n const days = document.getElementById('calc-days');\n const form = document.getElementById('calc-form');\n const box  …
  54. `mcp__playwright__browser_evaluate` {"target": "#calc-days", "element": "Поле срока", "function": "(el) => { el.focus(); el.select(); }"}
  55. `mcp__playwright__browser_type` {"target": "#calc-days", "element": "Поле срока", "text": "1e1", "slowly": true, "submit": true}
  56. `mcp__playwright__browser_evaluate` {"function": "() => ({ raw: document.getElementById('calc-days').value, error: document.getElementById('calc-error').innerText, result: docu …
  57. `mcp__playwright__browser_evaluate` {"function": "() => {\n const lum = (rgb) => { const [r,g,b] = rgb.match(/\\d+/g).map(Number).map(v=>{v/=255; return v<=0.03928? v/12.92 : M …

Итог сессии (2 ходов):

> Субагент `tester` отработал. Файлы не менялись. Его итог:
> 
> ## Подтверждённые проблемы
> 
> **1. Контраст вторичного текста ниже WCAG AA — 3.70:1** (средняя, но унаследована из фичи A)
> - Ожидалось (`docs/style-guide.md`): «Пары текст/фон должны проходить WCAG AA (4.5:1 для обычного текста)».
> - Факт: всё на `--ink-2` (#6E7D86) по `--paper` (#EDF0EE) = 3.70:1 при 14–17px обычного начертания.
> - Доказательство (замер по computed styles в браузере): `.field__label` 3.70, `.calc__extras legend` 3.70, `.extra__hint` 3.70, `.receipt__label` 3.70, `.receipt__row--deposit .receipt__value` 3.70. Для сравнения `.calc__error` — 5.28, итоговая строка — 12.72. Это свойство токена: в фиче A `.section__note` тоже 3.70. Тестом не покрыто.
> 
> **2. Сообщение об ошибке стоит не рядом с полем** (низкая)
> - Ожидалось (style-guide, п.4): «Ошибка ввода — текст цветом `--stamp` рядом с полем, с `role="alert"`».
> - Факт: `<p class="calc__error" role="alert">` в `index.html` идёт после кнопки submit, т.е. под всей формой, а не возле «Срок, суток». Цвет и `role` на месте, но `#calc-days` не связан с сообщением через `aria-describedby`/`aria-invalid`.
> 
> **3. Информационно (контракту не противоречит):** `1e1` в поле срока принимается как 10 суток (в поле остаётся `1e1`, в расшифровке «10 сут.»); при загрузке страницы селект предвыбран, но строка автопарка не помечена `data-chosen`; у `#calc-result` нет `aria-live`.
> 
> ## Подтверждено корректным
> - `sh scripts/check.sh` — 60 тестов, 60 pass, 0 fail. Консоль браузера — 0 ошибок/предупреждений за сессию.
> - Секция `#calculator` между `#fleet` и `#benefits`, ссылка в меню работает (`location.hash === '#calculator'`), один `h1`, внешних `http(s)`-ресурсов в DOM нет.
> - `calculateRental({carId, days, extras})` в `src/calc.js` — чистая, без DOM; `tests/calc.test.js` покрывает границы 6/7 и 13/14, 30 суток, опции, страховку, округление, залоги, все ошибочные входы и немутирование `extras`.
> - Расчёты вживую: Ларус 1.6 / 3 сут — 7 200 ₽, залог 10 000; 6 сут — без скидки, 7 сут — −10 % (−1 680); Мирта 2.0 / 14 сут + кресло + водитель + страховка — база 53 200, −15 % (−7 980), опции 11 200 (не под скидку), страховка 6 783 (15 % от 45 220), итого 63 203, залог 15 000 вне итога; Прима Лонг / 30 сут — 273 000 / −40 950 / 34 808 / 266 858. Все суммы целые.
> - Ошибки ввода: 0, −3, 31, 2.5 → «целое число суток от 1 до 30. Получено: …»; пустое и `abc` → «Укажите срок аренды…»; подменённый `carId` (вставлен `ghost-car`) → «Нет такой машины в автопарке…». Везде итог пуст, исключений нет.
> - Форматирование только через `formatPrice`, `tabular-nums` работает. Правка поля сбрасывает устаревший итог.
> - Фича A цела: кнопка в карточке выставляет машину, метит ровно одну строку `data-chosen`, обновляет `#fleet-status`, скроллит к калькулятору и ставит фокус на селект.
> - Адаптив: 360px — `scrollWidth === clientWidth === 360`, переполнений нет; 1280px — две колонки. Новых цветов нет (только `--stamp` из таблицы), `box-shadow: none`, без градиентов, `prefers-reduced-motion` уважается (`styles.css:692`), данные вымышленные.
> 
> ## Не проверено / заблокировано
> - Проверка шла на порту 8001 (как в задании), а не на 8000 из `docs/requirements.md`.
> - Реальный скринридер — только разметка и computed styles.
> - Реальные мобильные устройства — только эмуляция вьюпорта в Chromium.
> - `@media print`, тёмная тема, `forced-colors`, поведение с отключённым JS — требованиями не оговорены.
> - `curl` к `/` и `/src/calc.js` не выполнялся (команда требовала подтверждения); доступность модулей подтверждена косвенно — страница и ES-модули отработали без ошибок.
> 
> Исправлять ничего не стал — скажи, если браться за контраст и перенос сообщения об ошибке к полю.

## Сессия `06b-fix-b`
- session_id: `27cd8088-6875-466c-8006-92c8aa8363f3`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- субагент `tester` в списке агентов
- вызовы инструментов (28):
  1. `Bash` node -e ' const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; const L = (hex) => { const …
  2. `Write` /tmp/p4-playwright/contrast.mjs
  3. `mcp__playwright__browser_evaluate` {"function": "() => {\n const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };\n const L =  …
  4. `Edit` <worktree-B>/styles.css
  5. `Edit` <worktree-B>/docs/style-guide.md
  6. `Edit` <worktree-B>/docs/style-guide.md
  7. `mcp__playwright__browser_evaluate` {"function": "() => {\n const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };\n const L =  …
  8. `Edit` <worktree-B>/docs/style-guide.md
  9. `Edit` <worktree-B>/index.html
  10. `Edit` <worktree-B>/index.html
  11. `Edit` <worktree-B>/styles.css
  12. `Edit` <worktree-B>/styles.css
  13. `Edit` <worktree-B>/src/main.js
  14. `Edit` <worktree-B>/src/main.js
  15. `Edit` <worktree-B>/tests/index.test.js
  16. `mcp__playwright__browser_resize` {"width": 360, "height": 780}
  17. `mcp__playwright__browser_navigate` http://localhost:8001/
  18. `mcp__playwright__browser_type` {"target": "#calc-days", "element": "поле «Срок, суток» на 360 px", "text": "2.5", "submit": true}
  19. `mcp__playwright__browser_evaluate` {"function": "() => {\n const days = document.getElementById('calc-days');\n const err = document.getElementById('calc-error');\n const doc  …
  20. `mcp__playwright__browser_take_screenshot` {"target": "#calculator", "element": "калькулятор с ошибкой на 360 px", "filename": "/tmp/p4-playwright/calc-error-360.png", "scale": "css"}
  21. `Read` /tmp/p4-playwright/calc-error-360.png
  22. `mcp__playwright__browser_evaluate` {"function": "() => {\n const days = document.getElementById('calc-days');\n const form = document.getElementById('calc-form');\n days.value …
  23. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  24. `mcp__playwright__browser_navigate` http://localhost:8001/
  25. `mcp__playwright__browser_type` {"target": "#calc-days", "element": "поле «Срок, суток» на 1280 px", "text": "31", "submit": true}
  26. `mcp__playwright__browser_take_screenshot` {"target": "#calculator", "element": "калькулятор с ошибкой на 1280 px", "filename": "/tmp/p4-playwright/calc-error-1280-v2.png", "scale": " …
  27. `Read` /tmp/p4-playwright/calc-error-1280-v2.png
  28. `Bash` sh scripts/check.sh 2>&1 | tail -9; echo "=== git status --short ==="; git status --short
- ответы hook (из --debug-file, по одному на запуск; подряд одинаковые схлопнуты в ×N):
  - check-after-edit: PASS — ℹ tests 60 ℹ pass 60 ℹ fail 0 ×7
  - check-after-edit: PASS — ℹ tests 62 ℹ pass 62 ℹ fail 0

Итог сессии (29 ходов):

> Обе проблемы исправлены. Коммит не делал. Пункт 3 не трогал.
> 
> ## 1. Контраст `--ink-2`: `#6E7D86` → `#5A6871`
> 
> Расчёт по WCAG 2.1 (относительная яркость с sRGB-линеаризацией, `(L₁+0.05)/(L₂+0.05)`):
> 
> | цвет | L | контраст к `--paper` #EDF0EE (L = 0.864977) |
> |---|---|---|
> | `#6E7D86` (было) | 0.197035 | **3.70:1** ✗ |
> | `#64727B` | 0.161740 | 4.32:1 ✗ |
> | `#5E6C75` | 0.143892 | 4.72:1 ✓ |
> | **`#5A6871` (взял)** | **0.132665** | **5.01:1** ✓ |
> 
> Выбрал `#5A6871`, а не минимально проходящий `#5E6C75`: запас до порога (5.01 против 4.72) страхует от округления при рендере. Оттенок сохранён — HSL-тон 203.5° против 202.5° у исходного, тот же холодный серо-синий, изменилась только светлота (47.9 % → 39.8 %).
> 
> Обновлены `styles.css` (с комментарием о контрасте) и таблица токенов в `docs/style-guide.md`; туда же добавил строку со всеми тремя контрастами. Сначала я вписал для `--stamp` 5.70:1 — пересчёт дал **5.28:1**, в документе стоит верное значение. В браузере проверил, что весь вторичный текст (подписи полей, подсказки опций, строки расшифровки) резолвится в `rgb(90, 104, 113)`.
> 
> ## 2. Сообщение об ошибке у поля срока
> 
> - `<p id="calc-error" role="alert">` переехал из-под кнопки внутрь `.calc__fields`, сразу под поле срока; занимает всю ширину сетки (`grid-column: 1 / -1`), поэтому текст не дробится в узкой колонке.
> - У `#calc-days` статический `aria-describedby="calc-error"`.
> - При ошибке JS ставит `aria-invalid="true"`, при правке поля и при успешном расчёте — снимает. Дополнительно линия под полем окрашивается в `--stamp`, чтобы ошибка читалась не только цветом текста.
> 
> Тесты (`tests/index.test.js`): проверка, что `aria-describedby` есть, все его id существуют и среди них `calc-error`; и что сообщение стоит после поля срока, до кнопки, без других полей формы между ними.
> 
> ## Проверки в браузере (localhost:8001)
> 
> **360 px, ввод 2.5:** `aria-invalid="true"`, `aria-describedby="calc-error"` указывает на текст «Срок аренды — целое число суток от 1 до 30. Получено: 2.5.», цвет `rgb(180, 52, 42)` = `--stamp`, подчёркивание поля того же цвета, сообщение в 12 px под полем, 2 строки на 328 px, итог не выводится, горизонтального скролла нет. Правка поля → `aria-invalid` снят; корректная отправка (7 суток) → 15 120 ₽, ошибка пуста.
> 
> **1280 px, ввод 31:** то же, сообщение занимает ширину обеих колонок и стоит над блоком «Опции».
> 
> ```
> sh scripts/check.sh → tests 62, pass 62, fail 0
> ```
> 
> ```
>  M docs/style-guide.md
>  M index.html
>  M src/main.js
>  M src/render.js
>  M styles.css
>  M tests/index.test.js
>  M tests/render.test.js
> ?? src/calc.js
> ?? tests/calc.test.js
> ```

