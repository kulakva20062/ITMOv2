# Фича A: тесты → реализация → браузер

Промпт студента: «Реализуй фичу A по требованиям проекта, используя skill frontend-design. Сначала тесты и их падение, затем реализация. Проверь страницу через MCP playwright на 360 и 1280. Не делай commit. (вторая сессия — продолжение после лимита)»

## Сессия `04a-feature-a`
- session_id: `b275049c-c28e-4aac-ab41-8dff1d409c0f`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- вызовы инструментов (68):
  1. `Bash` cat package.json && node --version && ls -a .claude/skills 2>/dev/null
  2. `Write` tests/cars.test.js
  3. `Write` tests/render.test.js
  4. `Edit` tests/render.test.js
  5. `Write` tests/index.test.js
  6. `Bash` sh scripts/check.sh 2>&1 | tail -40
  7. `Write` src/cars.js
  8. `Write` src/render.js
  9. `Bash` node --test "tests/cars.test.js" "tests/render.test.js" 2>&1 | tail -25
  10. `Write` index.html
  11. `Write` styles.css
  12. `Write` src/main.js
  13. `Bash` sh scripts/check.sh 2>&1 | tail -30
  14. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_resize,mcp__playwright__browser_take_screenshot,mcp__playwright …
  15. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  16. `mcp__playwright__browser_navigate` http://localhost:8000/
  17. `mcp__playwright__browser_console_messages` {"level": "error"}
  18. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/d1280-full.png", "fullPage": true}
  19. `Read` /tmp/p4-playwright/d1280-full.png
  20. `Edit` styles.css
  21. `Edit` styles.css
  22. `Edit` index.html
  23. `Edit` index.html
  24. `Edit` index.html
  25. `mcp__playwright__browser_navigate` http://localhost:8000/
  26. `mcp__playwright__browser_evaluate` {"function": "() => ({ docW: document.documentElement.scrollWidth, innerW: window.innerWidth, cars: document.querySelectorAll('[data-car-id] …
  27. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/d1280-hero.png"}
  28. `Read` /tmp/p4-playwright/d1280-hero.png
  29. `Edit` index.html
  30. `mcp__playwright__browser_resize` {"width": 360, "height": 800}
  31. `mcp__playwright__browser_navigate` http://localhost:8000/
  32. `mcp__playwright__browser_evaluate` {"function": "() => { const d=document.documentElement; const over=[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientR …
  33. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/m360-full.png", "fullPage": true}
  34. `Read` /tmp/p4-playwright/m360-full.png
  35. `mcp__playwright__browser_evaluate` {"function": "() => { document.getElementById('fleet').scrollIntoView(); return true; }"}
  36. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/m360-fleet.png"}
  37. `Read` /tmp/p4-playwright/m360-fleet.png
  38. `Edit` styles.css
  39. `mcp__playwright__browser_navigate` http://localhost:8000/#fleet
  40. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/m360-anchor.png"}
  41. `Read` /tmp/p4-playwright/m360-anchor.png
  42. `mcp__playwright__browser_evaluate` {"function": "() => ({ pad: getComputedStyle(document.documentElement).scrollPaddingTop, headerH: document.querySelector('.topbar').getBound …
  43. `mcp__playwright__browser_evaluate` {"function": "async () => { const l=document.querySelector('link[rel=stylesheet]'); l.href='./styles.css?v='+Date.now(); await new Promise(r …
  44. `mcp__playwright__browser_click` {"element": "Ссылка меню «Автопарк»", "target": ".nav a[href=\"#fleet\"]"}
  45. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/m360-anchor2.png"}
  46. `Read` /tmp/p4-playwright/m360-anchor2.png
  47. `mcp__playwright__browser_click` {"element": "Кнопка «Рассчитать» у Мирта 2.0", "target": "[data-calc-for=\"mirta-20\"]"}
  48. `mcp__playwright__browser_evaluate` {"function": "() => ({ status: document.getElementById('fleet-status').textContent, chosen: document.querySelectorAll('.car[data-chosen]').l …
  49. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  50. `mcp__playwright__browser_evaluate` {"function": "async () => { const l=document.querySelector('link[rel=stylesheet]'); l.href='./styles.css?v='+Date.now(); await new Promise(r …
  51. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/d1280-fleet2.png"}
  52. `Read` /tmp/p4-playwright/d1280-fleet2.png
  53. `Edit` styles.css
  54. `Edit` styles.css
  55. `mcp__playwright__browser_evaluate` {"function": "async () => { const l=document.querySelector('link[rel=stylesheet]'); l.href='./styles.css?v='+Date.now(); await new Promise(r …
  56. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/d1280-fleet3.png"}
  57. `Read` /tmp/p4-playwright/d1280-fleet3.png
  58. `Edit` styles.css
  59. `Edit` styles.css
  60. `mcp__playwright__browser_evaluate` {"function": "async () => { const l=document.querySelector('link[rel=stylesheet]'); l.href='./styles.css?v='+Date.now(); await new Promise(r …
  61. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/d1280-fleet4.png"}
  62. `Read` /tmp/p4-playwright/d1280-fleet4.png
  63. `mcp__playwright__browser_resize` {"width": 360, "height": 800}
  64. `mcp__playwright__browser_evaluate` {"function": "async () => { const l=document.querySelector('link[rel=stylesheet]'); l.href='./styles.css?v='+Date.now(); await new Promise(r …
  65. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/m360-fleet2.png"}
  66. `Read` /tmp/p4-playwright/m360-fleet2.png
  67. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  68. `mcp__playwright__browser_navigate` http://localhost:8000/?fresh=1

Итог сессии (71 ходов):

> You've hit your session limit · resets 2:10am (Europe/Moscow)

## Сессия `04b-feature-a`
- session_id: `b275049c-c28e-4aac-ab41-8dff1d409c0f`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- вызовы инструментов (15):
  1. `mcp__playwright__browser_console_messages` {"level": "warning"}
  2. `mcp__playwright__browser_resize` {"width": 1280, "height": 900}
  3. `mcp__playwright__browser_navigate` http://localhost:8000/?fresh=2
  4. `mcp__playwright__browser_evaluate` {"function": "() => { const d=document.documentElement; const over=[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundi …
  5. `mcp__playwright__browser_console_messages` {"level": "warning"}
  6. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/final-1280.png", "fullPage": true}
  7. `Read` /tmp/p4-playwright/final-1280.png
  8. `mcp__playwright__browser_resize` {"width": 360, "height": 800}
  9. `mcp__playwright__browser_navigate` http://localhost:8000/?fresh=3
  10. `mcp__playwright__browser_evaluate` {"function": "() => { const d=document.documentElement; const over=[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundi …
  11. `mcp__playwright__browser_console_messages` {"level": "warning"}
  12. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/final-360.png", "fullPage": true}
  13. `Read` /tmp/p4-playwright/final-360.png
  14. `Bash` sh scripts/check.sh 2>&1 | tail -12; echo "=== status ==="; git status --short; echo "=== diff --stat (HEAD) ==="; git diff --stat HEAD -- . …
  15. `Bash` wc -l index.html styles.css src/cars.js src/render.js src/main.js tests/cars.test.js tests/render.test.js tests/index.test.js

Итог сессии (18 ходов):

> Фича A готова. Коммит не делал.
> 
> ## Что сделано
> 
> **Тесты (написаны первыми, 22 новых):**
> - `tests/cars.test.js` — контракт данных: ≥6 машин, уникальные `id`, классы/коробки из перечислений, целые `seats` и `pricePerDay`, все четыре класса представлены.
> - `tests/render.test.js` — чистая разметка строки: `data-car-id`, все поля, кнопка «Рассчитать» с `data-calc-for`, число строк = числу машин, экранирование `<`/`"` в данных.
> - `tests/index.test.js` — структура: ровно один `h1`, шесть секций по порядку, каждый `href="#…"` ведёт на существующий `id`, меню покрывает все секции, нет `http(s)://`, 4 `details/summary`, 3 шага, 3–4 преимущества, заглушки контактов, подписи у `svg`, автопарк строится скриптом (в HTML `data-car-id` нет).
> 
> **Реализация:** `src/cars.js` (8 машин, 4 класса), `src/render.js` (чистые `carRowHtml`/`fleetHtml`/`escapeHtml`/`seatsLabel`), `src/main.js` (вставка реестра + выбор машины с `role="status"`), `index.html`, `styles.css`.
> 
> **Дизайн** — по плану «лист осмотра»: левая рейка подписей, волосяные линии вместо карточек, паспорт машины строкой реестра (на 360 px разворачивается в блок полей с видимыми подписями; на широком экране подписи остаются для скринридера через `clip-path`). Янтарь `#f0b323` после просмотра скриншота убрал с восьми кнопок реестра — он остался только у главного действия в герое и у отметки выбранной строки; кнопки реестра стали контурными. Схема кузова — inline SVG, одна анимация на странице (заливка панели), выключается при `prefers-reduced-motion`.
> 
> ## Результат проверок
> 
> - **Красный прогон (до реализации):** 5 pass / 3 fail — падали все три новых файла (`ERR_MODULE_NOT_FOUND: src/render.js`, `src/cars.js`, отсутствующий `index.html`).
> - **Зелёный прогон:** `tests 24, pass 24, fail 0`.
> - **1280 px:** `scrollWidth = innerWidth = 1280`, элементов за правой границей нет, консоль — 0 ошибок, 0 предупреждений. 8 строк реестра, колонки совпадают с шапкой.
> - **360 px:** `scrollWidth = innerWidth = 360`, переполнений нет, консоль чистая.
> - **Исправлено по ходу проверки:** 404 на `/favicon.ico` (добавил `<link rel="icon" href="data:,">` — без сетевых запросов и без `http://` в разметке); якорное меню на 360 px заводило заголовок под липкую шапку (`scroll-padding-top: 8.5rem` в мобильной медиавыборке); выбранная строка съезжала вправо на 12 px (отступ под отметку теперь у всех строк, реестр выходит в левое поле); колонки шапки реестра не совпадали с данными (последняя колонка получила фиксированную ширину).
> - Клик «Рассчитать» проверен в браузере: `data-chosen` ровно на одной строке, статус «Выбрана Мирта 2.0 — 3 800 ₽ за сутки.»
> 
> ## git diff --stat
> 
> ```
>  25 files changed, 1476 deletions(-)
> ```
> 
> Это **не мои изменения**: рабочее дерево на старте сессии уже было в таком состоянии — содержимое прошлой практики 4 стоит в индексе как удалённое, а сам каталог `project/` git видит как неотслеживаемый (`?? ./`). Поэтому все созданные мной файлы в `diff --stat` не попадают, вот они через `git status --short --untracked-files=all`:
> 
> ```
> ?? index.html          182 строки   (новый)
> ?? styles.css          523          (новый)
> ?? src/cars.js          82          (новый)
> ?? src/render.js        50          (новый)
> ?? src/main.js          28          (новый)
> ?? tests/cars.test.js   43          (новый)
> ?? tests/render.test.js 46          (новый)
> ?? tests/index.test.js  85          (новый)
> ```
> 
> Остальное в списке неотслеживаемых (`AGENTS.md`, `CLAUDE.md`, `docs/requirements.md`, `scripts/check.sh`, `package.json`, `src/format.js`, `tests/format.test.js`, `.claude/**`, `.mcp.json`) существовало до меня — я их не трогал. `docs/style-guide.md` не создавал, вы его не подтверждали.
> 
> ## Выполненные команды
> 
> ```
> cat package.json && node --version && ls -a .claude/skills
> sh scripts/check.sh                                   # красный: 5 pass / 3 fail
> node --test tests/cars.test.js tests/render.test.js   # промежуточный: 10/10
> sh scripts/check.sh                                   # зелёный: 24/24
> wc -l index.html styles.css src/*.js tests/*.test.js
> git status --short
> git diff --stat HEAD -- .
> git status --short --untracked-files=all -- .
> ```
> 
> Браузер (MCP playwright): `browser_resize` 1280×900 и 360×800, `browser_navigate` на `http://localhost:8000/` (+ `?fresh=2`, `?fresh=3`, `#fleet`), `browser_evaluate` для замеров `scrollWidth`/переполнений/состояния выбора, `browser_click` по меню и по кнопке «Рассчитать», `browser_console_messages`, `browser_take_screenshot` (скриншоты в `/tmp/p4-playwright/`).
> 
> Следующий шаг, когда скажете, — фича B: `src/calc.js` с тестами на границы скидки 6/7 и 13/14 суток, опции, страховку и все ошибочные входы.

