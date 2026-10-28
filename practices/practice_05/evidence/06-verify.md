# Шаг 5. Независимая проверка отдельным чатом

## Сессия `05-verify` — отдельный чат-проверяющий

Промпт:

```text
Прочитай требования fleet-filter (openspec/changes/fleet-filter/) и изменения (базовая версия: git show a80c913:practices/practice_04/project/<файл> | diff -u - <файл>).
Найди и запусти команду проверки этого проекта.
Проверь основной, ошибочный и старый сценарии — страница раздаётся на http://localhost:8000/, используй MCP playwright (360 и 1280 px).
По каждому: ожидание → факт → доказательство.
Файлы не меняй, скриншоты сохраняй только в /tmp/p5-playwright.
Не считай отчёт автора самостоятельной проверкой.
```

- session_id: `cbf82016-368f-47bf-82c4-a7663afa30f9`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (76):
  1. `Bash` ls /home/kulakva/Documents/ITMOv2/practices/practice_05/project/ && echo "---" && ls -R /home/kulakva/Documents/ITMOv2/practices/practice_05 …
  2. `Bash` git status --short | head -50 && echo "--- untracked:" && git ls-files --others --exclude-standard | head -50
  3. `Bash` cat openspec/changes/fleet-filter/proposal.md openspec/changes/fleet-filter/specs/fleet-filtering/spec.md openspec/changes/fleet-filter/task …
  4. `Bash` cat scripts/check.sh && echo "=== design" && cat openspec/changes/fleet-filter/design.md
  5. `Bash` cat /home/kulakva/.claude/projects/-home-kulakva-Documents-ITMOv2-practices-practice-05-project/cbf82016-368f-47bf-82c4-a7663afa30f9/tool-re …
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/specs/fleet-filtering/spec.md
  7. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/tasks.md
  8. `Bash` for f in index.html styles.css src/main.js src/render.js src/cars.js src/calc.js src/format.js docs/requirements.md scripts/check.sh tests/i …
  9. `Bash` for f in index.html styles.css src/main.js src/render.js src/cars.js src/calc.js src/format.js docs/requirements.md scripts/check.sh tests/i …
  10. `Write` /tmp/p5-diff.sh
  11. `Bash` cd /home/kulakva/Documents/ITMOv2/practices/practice_05/project; git show a80c913:practices/practice_04/project/src/render.js | diff -u - sr …
  12. `Bash` git show a80c913:practices/practice_04/project/src/render.js | diff -u - src/render.js
  13. `Bash` git show a80c913:practices/practice_04/project/src/cars.js | diff -u - src/cars.js
  14. `Bash` git show a80c913:practices/practice_04/project/scripts/check.sh | diff -u - scripts/check.sh
  15. `Bash` git show a80c913:practices/practice_04/project/src/calc.js | diff -u - src/calc.js
  16. `Bash` git show a80c913:practices/practice_04/project/index.html | diff -u - index.html
  17. `Bash` git show a80c913:practices/practice_04/project/src/main.js | diff -u - src/main.js
  18. `Bash` git show a80c913:practices/practice_04/project/styles.css | diff -u - styles.css
  19. `Bash` git show a80c913:practices/practice_04/project/tests/index.test.js | diff -u - tests/index.test.js
  20. `Bash` git show a80c913:practices/practice_04/project/docs/requirements.md | diff -u - docs/requirements.md
  21. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/filter.js
  22. `Bash` sh scripts/check.sh 2>&1 | tail -25
  23. `Bash` cat src/cars.js
  24. `Bash` node --test tests/filter.test.js 2>&1 | tail -8; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/ --max-time 3
  25. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_resize,mcp__playwright__browser_snapshot,mcp__playwright__brows …
  26. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  27. `mcp__playwright__browser_navigate` http://localhost:8000/
  28. `mcp__playwright__browser_evaluate` {"function": "() => {\n const rows = [...document.querySelectorAll('#fleet-list [data-car-id]')].map(r=>r.dataset.carId);\n return {\n class …
  29. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/01-default-1280.png", "fullPage": true}
  30. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-class", "element": "Класс (фильтр)", "values": ["suv"]}
  31. `mcp__playwright__browser_evaluate` {"function": "() => {\n const rows = [...document.querySelectorAll('#fleet-list [data-car-id]')].map(r=>r.dataset.carId);\n return { rows, c …
  32. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/02-suv-1280.png"}
  33. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-gearbox", "element": "Коробка (фильтр)", "values": ["manual"]}
  34. `mcp__playwright__browser_evaluate` {"function": "() => ({\n rows: [...document.querySelectorAll('#fleet-list [data-car-id]')].map(r=>r.dataset.carId),\n count: document.getEle …
  35. `mcp__playwright__browser_click` {"target": "#fleet-list [data-car-id=\"taiga-lift\"] button[data-calc-for]", "element": "Кнопка «Рассчитать» у Тайга Лифт"}
  36. `mcp__playwright__browser_evaluate` {"function": "() => ({\n chosen: [...document.querySelectorAll('#fleet-list [data-chosen]')].map(r=>r.dataset.carId),\n fleetStatus: documen …
  37. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/03-suv-manual-chosen-1280.png", "fullPage": true}
  38. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-gearbox", "element": "Коробка (фильтр)", "values": ["any"]}
  39. `mcp__playwright__browser_evaluate` {"function": "() => ({\n rows: [...document.querySelectorAll('#fleet-list [data-car-id]')].map(r=>r.dataset.carId),\n chosen: [...document.q …
  40. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-class", "element": "Класс (фильтр)", "values": ["economy"]}
  41. `mcp__playwright__browser_evaluate` {"function": "() => ({\n rows: [...document.querySelectorAll('#fleet-list [data-car-id]')].map(r=>r.dataset.carId),\n chosen: [...document.q …
  42. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-class", "element": "Класс (фильтр)", "values": ["suv"]}
  43. `mcp__playwright__browser_evaluate` {"function": "() => ({\n chosen: [...document.querySelectorAll('#fleet-list [data-chosen]')].map(r=>r.dataset.carId),\n count: document.getE …
  44. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-class", "element": "Класс (фильтр)", "values": ["business"]}
  45. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-gearbox", "element": "Коробка (фильтр)", "values": ["manual"]}
  46. `mcp__playwright__browser_evaluate` {"function": "() => {\n const head = document.querySelector('.fleet__head');\n const empty = document.querySelector('.fleet__empty');\n retu …
  47. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/04-empty-1280.png", "fullPage": true}
  48. `mcp__playwright__browser_select_option` {"target": "#fleet-filter-gearbox", "element": "Коробка (фильтр)", "values": ["any"]}
  49. `mcp__playwright__browser_evaluate` {"function": "() => ({\n rows: [...document.querySelectorAll('#fleet-list [data-car-id]')].map(r=>r.dataset.carId),\n empty: !!document.quer …
  50. `mcp__playwright__browser_evaluate` {"function": "async () => {\n const m = await import('/src/filter.js');\n const { cars } = await import('/src/cars.js');\n const out = {};\n …
  51. `mcp__playwright__browser_evaluate` {"function": "() => {\n const d = document.getElementById('calc-days');\n d.value = '10';\n d.dispatchEvent(new Event('input', { bubbles: tr …
  52. `mcp__playwright__browser_evaluate` {"function": "() => {\n const d = document.getElementById('calc-days');\n const out = {};\n for (const v of ['0', '400', 'abc']) {\n d.value …
  53. `mcp__playwright__browser_console_messages` {"level": "warning"}
  54. `mcp__playwright__browser_select_option` {"target": "#calc-car", "element": "Машина в калькуляторе", "values": ["prima-sedan"]}
  55. `mcp__playwright__browser_evaluate` {"function": "() => {\n const before = [...document.querySelectorAll('#fleet-list [data-chosen]')].map(r=>r.dataset.carId);\n const g = docu …
  56. `mcp__playwright__browser_resize` {"width": 360, "height": 800}
  57. `mcp__playwright__browser_navigate` http://localhost:8000/
  58. `mcp__playwright__browser_evaluate` {"function": "() => ({\n rows: [...document.querySelectorAll('#fleet-list [data-car-id]')].length,\n count: document.getElementById('fleet-c …
  59. `mcp__playwright__browser_evaluate` {"function": "() => { document.getElementById('fleet').scrollIntoView(); }"}
  60. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/05-default-360.png"}
  61. `Read` /tmp/p5-playwright/05-default-360.png
  62. `mcp__playwright__browser_evaluate` {"function": "() => {\n const c = document.getElementById('fleet-filter-class');\n const g = document.getElementById('fleet-filter-gearbox') …
  63. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/06-empty-360.png"}
  64. `Read` /tmp/p5-playwright/06-empty-360.png
  65. `mcp__playwright__browser_evaluate` {"function": "() => {\n const empty = document.querySelector('.fleet__empty');\n const count = document.getElementById('fleet-count');\n con …
  66. `ToolSearch` {"query": "select:mcp__contrast__check_contrast", "max_results": 1}
  67. `mcp__contrast__check_contrast` {"foreground": "#5A6871", "background": "#EDF0EE"}
  68. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  69. `mcp__playwright__browser_evaluate` {"function": "() => { document.getElementById('fleet').scrollIntoView(); }"}
  70. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p5-playwright/07-empty-1280-viewport.png"}
  71. `Read` /tmp/p5-playwright/07-empty-1280-viewport.png
  72. `mcp__playwright__browser_evaluate` {"function": "() => {\n const l = document.getElementById('fleet-list');\n const e = document.querySelector('.fleet__empty');\n return { lis …
  73. `Grep` max-width|^p[ ,{]|measure
  74. `mcp__playwright__browser_evaluate` {"function": "() => {\n const s = getComputedStyle(document.getElementById('fleet-filter-class'));\n return { dur: s.transitionDuration, pro …
  75. `Bash` ls -la /tmp/p5-playwright/
  76. `mcp__playwright__browser_close` {}
- итог: success, 77 ходов, 332 с

Ответ агента:

# Проверка fleet-filter — независимый прогон

Файлы не менялись. Скриншоты и снапшоты — в `/tmp/p5-playwright`.

## Команда проверки

`sh scripts/check.sh` (единственный раннер, `node --test "tests/**/*.test.js"`).
**Факт:** `tests 86 / pass 86 / fail 0`. Из них `tests/filter.test.js` — 15.

## Сравнение с базой `a80c913`

| Файл | Ожидание | Факт |
|---|---|---|
| `src/render.js`, `src/cars.js`, `src/calc.js`, `src/format.js`, `scripts/check.sh` | не тронуты | `diff -u` пуст |
| `index.html` | только блок фильтра | +14 строк, ни одной `-`; `#fleet-status`/`#fleet-list`/`#calculator` не тронуты |
| `styles.css` | только новые правила | только `+`: `.fleet-filter`, `.fleet-filter__count`, `.fleet__empty`, `.fleet__head[hidden]` |
| `src/main.js` | связка фильтра | только `+` и 3 замены: `list.innerHTML = fleetHtml(cars)` → `renderFleet()`, `markChosen(...)` → через `chosenCarId`. Существующие функции сохранены |
| `docs/requirements.md` | только «Фича C» | +28 строк, в секциях A и B ни одной `-` |
| `tests/index.test.js` | только дописанные тесты | +5 тестов, ни одной `-` — существующие не правились |
| `src/filter.js`, `tests/filter.test.js` | новые | в базе отсутствуют |

Итого 86 = 66 (база) + 15 + 5 — сходится с заявкой в `tasks.md`.

## Браузер (http://localhost:8000/, 1280 и 360 px)

**Основной сценарий**
- Умолчание → оба селекта `any`, 8 строк в исходном порядке, «Показано 8 из 8», шапка видна, ни одна строка не отмечена, в калькуляторе 8 опций, горизонтального скролла нет. *Факт совпал.* `01-default-1280.png`, `05-default-360.png`
- Класс «внедорожник» → `nordkap-4x4, taiga-lift` (порядок исходный), «Показано 2 из 8». *Совпал.* `02-suv-1280.png`
- + коробка «механика» → только `taiga-lift`, «Показано 1 из 8» — И работает. *Совпал.*
- «Рассчитать» у `taiga-lift` → `data-chosen` на строке, `#fleet-status` = «Выбрана Тайга Лифт — 4 300 ₽ за сутки.», `#calc-car` = `taiga-lift`, прокрутка к `#calculator` (его `top` = 80). *Совпал.* `03-suv-manual-chosen-1280.png`
- Коробка обратно в «любая» → отметка пережила перерисовку (`chosen: [taiga-lift]`), счётчик «Показано 2 из 8», `#fleet-status` не изменился — счётчик его не затёр. *Совпал.*
- Класс «эконом» (выбранная машина отфильтрована) → отметок нет, `#fleet-status` прежний, `#calc-car` = `taiga-lift`. Возврат на «внедорожник» → отметка снова на `taiga-lift`. *Совпал.*
- Смена машины через селект калькулятора → отметка переехала на `prima-sedan` и пережила последующую смену фильтра. *Совпал.*

**Ошибочный сценарий**
- Пустой результат «бизнес» + «механика» → 0 строк, текст дословно «Под эти условия машин нет — выберите «Любой класс» или «Любая коробка»», `fleetHead.hidden = true`, `display: none`, счётчик «Показано 0 из 8», `#fleet-status` не тронут, скролла нет — и на 1280, и на 360. *Совпал.* `04-empty-1280.png`, `07-empty-1280-viewport.png`, `06-empty-360.png`
- Выход из пустого: коробка → «любая» → сообщение убрано, шапка вернулась (`display: grid`), 2 машины бизнес-класса. *Совпал.*
- `filterCars(cars, {carClass:'limousine'})` → `RangeError: Нет такого класса в автопарке: limousine. Допустимые классы: economy, comfort, business, suv.`; `{gearbox:'robot'}` → аналогично по коробкам. Исходный `cars` не мутирован (8). *Совпал.*
- Калькулятор: `0` → «Срок аренды — целое число суток от 1 до 30. Получено: 0.», `400` → то же с 400, пустой/нечисловой → «Укажите срок аренды…», `aria-invalid="true"`, итог очищен. *Совпал.*

**Старый сценарий (фичи A и B)**
- Расчёт при активном фильтре: Тайга Лифт × 10 сут → база 43 000 ₽, скидка 10 % −4 300 ₽, итого 38 700 ₽, залог 25 000 ₽ отдельно. *Совпал.*
- Список калькулятора остаётся полным (8 опций) при фильтре до одной машины. *Совпал.*
- На 360 px шапка реестра скрыта медиазапросом, карточки в столбик, элементов за правой границей вьюпорта — 0.

**Оформление:** селекты — `border-radius: 0`, `box-shadow: none`, `transition-duration: 0s`, `animation: none`. Счётчик и пустой результат — `--ink-2` `#5A6871` на `#EDF0EE`, контраст ≈ 5.0:1, WCAG AA для обычного текста проходит; `--stamp` не использован.

**Консоль:** 0 ошибок. Единственное предупреждение — от моего же ввода `abc` в `input[type=number]`, не дефект страницы.

## Замечания (не блокеры, спеку не нарушают)

1. На 360 px подпись «Любая коробка» впритык к стрелке селекта (ширина колонки 152 px) — последний символ почти под стрелкой. Скролла нет, но читается тесно: `05-default-360.png`.
2. Нижняя линия строки пустого результата короче верхней линии реестра (670 px против 956 px) — `.fleet__empty` подчиняется общему `p { max-width: 62ch }`. Видно на `07-empty-1280-viewport.png`.

Расхождений с `specs/fleet-filtering/spec.md` не нашёл: все 13 сценариев воспроизведены.
