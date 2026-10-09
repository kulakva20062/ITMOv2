# AGENTS.md: агент читает правила

Промпт студента: «Прочитай AGENTS.md и требования проекта. Ничего не меняй. Назови: стек, команду проверки, пример теста, границы фичи A и ограничения.»

## Сессия `01-rules`
- session_id: `4d02ebd5-05b5-46f4-a393-7fe22658db3b`, модель `claude-opus-5[1m]`
- skills проекта в init: []; MCP: [('plugin:aseprite:aseprite', 'connected'), ('plugin:drawio:drawio', 'connected'), ('plugin:comfyui:comfyui', 'connected'), ('plugin:gimp:gimp', 'connected'), ('plugin:blender:blender', 'connected'), ('claude-in-chrome', 'connected')]
- вызовы инструментов (6):
  1. `Bash` ls -R . | head -60
  2. `Read` docs/requirements.md
  3. `Read` scripts/check.sh
  4. `Read` tests/format.test.js
  5. `Read` src/format.js
  6. `Read` package.json

Итог сессии (7 ходов):

> Прочитал `AGENTS.md`, `docs/requirements.md`, `scripts/check.sh`, `tests/format.test.js`, `src/format.js`, `package.json`. Ничего не менял. `docs/style-guide.md` в проекте нет (AGENTS.md упоминает его условно — «если файл есть»).
> 
> ## Стек
> Чистые HTML + CSS + JavaScript (ES-модули). Без фреймворков, сборщиков и npm-зависимостей. Тесты — встроенный раннер Node 24 (`node --test`). Страница отдаётся как статика: `python3 -m http.server 8000`, `http://localhost:8000/`.
> 
> ## Команда проверки
> `sh scripts/check.sh` — должна проходить после каждой правки. Внутри: `cd` в корень проекта и `node --test "tests/**/*.test.js"` (тот же скрипт висит на `npm test`).
> 
> ## Пример теста
> `tests/format.test.js` — задаёт образец стиля: `import { test } from 'node:test'`, `assert from 'node:assert/strict'`, импорт тестируемой чистой функции из `../src/`, по одному `test()` на поведение с описанием на русском:
> 
> ```js
> test('formatPrice разделяет разряды и добавляет знак рубля', () => {
>   assert.equal(formatPrice(12500), '12 500 ₽');
> });
> ```
> 
> ## Границы фичи A (лендинг)
> **Входит:**
> - Файлы: `index.html`, `styles.css`, при необходимости `src/main.js`; данные автопарка — `src/cars.js` (экспорт массива `cars` с полями `id`, `model`, `class`, `gearbox`, `seats`, `pricePerDay`), разметка карточек строится из этого массива.
> - Секции строго по порядку, у каждой свой `id`: шапка (логотип-текст AutoDrive + меню-якоря на все секции ниже), `#hero` (единственный `h1`, подзаголовок, кнопка «Выбрать автомобиль» → `#fleet`), `#fleet` (≥6 карточек: модель, класс из `economy`/`comfort`/`business`/`suv`, коробка, число мест, цена за сутки, кнопка «Рассчитать», атрибут `data-car-id`), `#benefits` (3–4 преимущества), `#how` (3 шага), `#faq` (4 вопроса через `details/summary`), `#contacts` (заглушки контактов).
> - Критерии приёмки: все ссылки меню ведут на существующие `id`; ровно один `h1`; у каждого смыслового `img`/`svg` есть `alt` или `aria-label`; никаких внешних ресурсов в `src`/`href` (только `#` и относительные пути); нет горизонтального скролла на 360 px и 1280 px; `sh scripts/check.sh` проходит, тесты проверяют данные `cars` и структуру `index.html`.
> 
> **Не входит (это фича B):**
> - Секция `#calculator` (между `#fleet` и `#benefits`) и ссылка на неё в меню.
> - `src/calc.js` с `calculateRental({ carId, days, extras })`, правила скидок/опций/страховки/залога, `RangeError` на неверный ввод и вывод сообщения на странице.
> - Поведение кнопки «Рассчитать»: выбор машины в калькуляторе и скролл к нему. В фиче A кнопка есть в разметке, но её логика — часть B.
> - Тесты на `calculateRental` (границы 6/7 и 13/14 суток, опции, страховка, ошибочные входы).
> 
> ## Ограничения на всю работу
> - Только вымышленные данные: никаких реальных адресов, телефонов, e-mail и брендов прокатов. Заглушки — `+7 000 000-00-00`, `hello@example.com`.
> - Никаких внешних CDN, шрифтов и картинок из сети. Изображения — только CSS или inline SVG.
> - Логика расчётов — в `src/` как чистые функции, покрытые тестами.
> - Нельзя менять контракт в `docs/requirements.md`, `scripts/check.sh` и существующие тесты ради зелёного результата без поручения.
> - Коммиты не делаю — это делает студент после приёмки.
> - Перед любой правкой вёрстки читать `docs/style-guide.md`, если он появится.

