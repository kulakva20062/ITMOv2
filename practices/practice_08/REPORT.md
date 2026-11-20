# Отчёт: практика 8 — добавляем фронтенд к своему проекту с помощью AI (v2)

Проект: лендинг проката **AutoDrive** (курс ITMO × Avito, ветка
`2026_Kulakovskii_Vlad_practies_8`). Интерфейс v2 — одностраничное React-приложение
в `project/web/`; клиентские тесты — `project/tests/e2e/`; макет v2 —
`mockup/index.html`; скриншоты состояний — `project/docs/screenshots/`.

Запись занятия: «Лекция + Практика 8: Дизайн на фронтенде», 12.11.2026,
https://avito.ktalk.ru/recordings/BA3nowru0dVoFZnaulOr — требования выполнялись по
её транскрипции (AI-генерация фронта, дизайн-система, компонентная библиотека,
макеты, Playwright-тесты, критерии оценки фронтенда).

В этой версии (v2) прежняя статическая страница на Bootstrap переведена на
React по дизайн-контракту `project/docs/design-contract.md` v2.1.0. Отчёт
описывает именно финальный вид v2; исторические промпты и правки v1 оставлены в
разделе «Использование AI» и в `mockup/README.md`.

## Основной пользовательский сценарий

Кто: посетитель проката. Задача: арендовать машину и понять цену до звонка.
Результат: принятая заявка с номером `AD-…`, читаемая по `GET /api/bookings/{id}`.

1. Выбор машины в автопарке (карточка, кнопка «Рассчитать» → выбор синхронизирует
   калькулятор и подсвечивает карточку рамкой `--ink` + обводкой `--signal`).
2. Расчёт: срок 1–30 суток, опции; скидка 10 % от 7 суток и 15 % от 14, залог
   отдельно; общий чек `Receipt` показывает базу, скидку, опции, страховку, итог.
3. Заявка: имя, телефон, дата начала — срок и опции берутся из снимка расчёта,
   цену пересчитывает сервер.
4. Отправка в реальный API (`POST /api/bookings` того же `server.js`) и видимый
   результат: штамп «Заявка принята» с номером `AD-…` и чек подтверждения.

Скриншоты состояний (`project/docs/screenshots/`): `01-hero-final`,
`02-fleet-chosen`, `03-fleet-empty-filter`, `04-calculator-result`,
`05-booking-no-estimate`, `06-booking-validation`, `07-booking-submitting`,
`08-booking-success-stamp`, `09-booking-error`, `10-mobile-360`.

## Часть 1. Макет / прототип

Кликабельный макет всех экранов и состояний основного сценария —
`mockup/index.html` (открывается двойным кликом, без JS, сборки и внешних
ресурсов; вкладки на CSS `radio` + `:checked`). В v2 макет перерисован по
design-contract: 9 экранов сценария плюс вкладка «Движение» со статичными кадрами
пяти паттернов §3 (stroke-draw, reveal, stamp, shake, hover-glow). Внешний вид —
собственная CSS-аппроксимация shadcn-видов из токенов контракта, без библиотеки
через CDN. Описан вклад AI и правки: `mockup/README.md`.

Ключевые правки после проверки макета v2 (по `mockup/README.md`): поля состояния
«нет расчёта» сделаны реально `disabled`, двойной индикатор фокуса на `paper`,
финальные кадры анимаций — базовые стили (детерминизм скриншотов), числа чека —
один сквозной расчёт из `calculateRental` (24 511 ₽), Bootstrap и CDN удалены.
Макет сверен с живым интерфейсом после переключения корня на `web/dist`:
экраны соответствуют по структуре и состояниям, скриншоты ниже сняты с реального
приложения.

## Часть 2. Библиотека компонентов и интерфейс

- Стек: **React 19 + Vite 7 + TypeScript + Tailwind CSS 3 + shadcn/ui**
  (Radix-основы из npm). Внешних CDN, сетевых шрифтов и сетевых изображений нет;
  изображения — CSS и inline SVG. Сборка: `npm run web:build` → `web/dist`,
  раздача — `node server.js` (корень `/` и `/ui` отдают SPA, `/api/**` — API,
  один origin, `PORT` через env).
- Библиотека: **shadcn/ui** поверх Tailwind. Готовые примитивы в
  `web/src/components/ui/`: `Button`, `Input`, `Select`, `Checkbox`, `Label`,
  `Card`, `Badge`, `Separator`, `Spinner`; общий чек трёх видов —
  `web/src/components/Receipt.tsx` (мапперы `calcReceiptRows`,
  `snapshotReceiptRows`, `confirmationReceiptRows`). Секции переиспользуют их:
  `SiteHeader`/`HeroSection`/`FleetSection`/`CalculatorSection`/`BookingSection`/
  `SiteFooter` + info-секции. Параллельного набора компонентов нет.
- Единые цвета, типографика и отступы: токены `:root` (paper) и `.surface-night`
  в `web/src/styles/tokens.css` + Tailwind-тема (`web/tailwind.config.js`);
  motion-паттерны — `web/src/styles/motion.css`, норма — design-contract §2/§3.
  Палитра листа осмотра: paper/ink/ink-2/rule/signal/stamp + тёмная поверхность
  night; скругления 2 px, тени только `--glow-signal`. Контрасты WCAG AA
  проверяет тест `tests/contrast-mcp.test.js` через MCP-сервер
  `.claude/mcp/contrast_server.py` (источник токенов — `tokens.css`).
- Реальный сценарий с сервером: сабмит заявки идёт в `server.js` и создаёт бронь;
  e2e-тест `scenario.spec.mjs` читает созданную запись через `GET
  /api/bookings/{id}`.
- Соответствие макету: экраны повторяют `mockup/index.html` по структуре,
  состояниям и инвариантным `id`/`data-*`; числа чека синхронизированы с
  `src/calc.js`. Демонстрационное упрощение макета — экран автопарка показывает
  три карточки вместо восьми.
- Общее состояние секций — только `AppProvider`/`useRental` из
  `web/src/state/rental.tsx`; чистая логика переиспользуется импортами через
  alias `@legacy` (`src/cars.js`, `calc.js`, `filter.js`, `format.js`,
  `booking.js`, `booking-form.js`, `booking-text.js`), без копирования правил.
- Понятность и доступность: у всех полей подписи `label for`, подсказки и ошибки
  под полем с `role="alert"`/`aria-invalid`/`aria-describedby`; двойной индикатор
  фокуса на `paper` (`--ink` outline + кольцо `--signal`), на `night` — одиночный
  `--signal`. Полный сценарий проходится с клавиатуры (выбор машины стрелками,
  Tab по полям, Enter-отправка до номера заявки) — тест «полный сценарий с
  клавиатуры». Оговорка та же, что в v1: значение поля даты в этом тесте ставится
  программно (`fill` датой из `futureDate`), потому что посегментный набор
  `input[type=date]` зависит от локали; имя и телефон печатаются. На 360 px
  горизонтального скролла нет, кнопки доступны (тест).
- Motion и детерминизм: пять паттернов §3 и спиннер submitting; при
  `prefers-reduced-motion: reduce` все паттерны находятся в детерминированном
  финальном кадре — базовые стили равны финалу, JS только снимает скрытое
  начало. Поэтому скриншотные эталоны стабильны.
- Состояния: нет расчёта (поля реально `disabled`) / заполнение / ошибки /
  отправка / успех / «сервер недоступен» с повтором / конфликт даты 409 /
  пустой фильтр.
- Повторная отправка исключена синхронным guard-ом машины заявки
  (`useBookingMachine.ts`): ref-ы `inFlightRef`/`stateRef` решают до
  асинхронного React-state, поэтому ни клик, ни Enter, ни
  `form.requestSubmit()` не создают второй запрос ни во время ожидания, ни после
  подтверждения. На время запроса кнопка и поля `disabled`, `aria-busy`. Тест
  «submitting: … создают ровно один POST, success — ноль новых» проверяет обе
  ветки; смысл проверен саботажем (см. «Проверка смысла тестов»).

## Часть 3. Тестирование клиентской части с AI

Инструменты: Playwright (реальный системный Chromium), ответы сервера
подменяются через `page.route` телами в форматах реального API (201/400/409/500
и задержка собираются helper-ами из чистых модулей, как отвечает `server.js`).
Визуальные эталоны — `toHaveScreenshot` при `reducedMotion: 'reduce'`,
`locale: 'ru-RU'`, UTC, светлая схема.

| Файл | Что проверяет |
|---|---|
| `tests/e2e/landing.spec.mjs` | каркас React (один h1, секции, якоря, lang), отсутствие внешних ресурсов, карточки автопарка, фильтр с точным счётчиком и пустым состоянием, выбор карточки и синхронизация калькулятора, FAQ, noscript, чистая консоль |
| `tests/e2e/calculator.spec.mjs` | чек на трёх комбинациях через `calculateRental`, валидация срока (пусто/0/31), снятие устаревшего итога (R-01), семантика и computed-размеры полей |
| `tests/e2e/booking-states.spec.mjs` | состояния заявки: no-estimate/editing/валидация/задержка со спиннером и защита от двойной отправки/успех (mock 201)/500 + повтор/409/400 per-field/битое 201; доступность: подписи, `role=status`, Tab-обход, focus-visible, клавиатурный сценарий, 360px/1280px |
| `tests/e2e/scenario.spec.mjs` | полный сценарий на реальном API: выбор → расчёт → заявка → номер → чтение `GET /api/bookings/{id}` |
| `tests/e2e/visual.spec.mjs` | 7 скриншотных эталонов: hero final, выбранная карточка hover-glow, чек, валидация, submitting, success-штамп, полная страница 360px |

Итого клиентских тестов: **41** (34 поведенческих + 7 визуальных); node-тесты
логики и API — отдельно (`check.sh`).

Запуск и результат прогона (20.11.2026, Node 24.22, системный Chromium). Хвосты
вывода — дословно. Прогон Playwright собирает `web/dist`, поднимает свой сервер
на `PORT=8176` и гасит его после прогона (`reuseExistingServer: false`):

```text
$ sh scripts/check.sh
ℹ tests 208
ℹ suites 0
ℹ pass 208
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 395.599882
```

```text
$ npx playwright test
Running 41 tests using 1 worker
  ✓  34 [chromium] › tests/e2e/scenario.spec.mjs:6:1 › сценарий: от выбора машины до принятой заявки в реальном API (3.1s)
  ✓  41 [chromium] › tests/e2e/visual.spec.mjs:106:1 › 360px: полная страница no-estimate без горизонтального overflow (433ms)

  41 passed (32.4s)
```

```text
$ npm run screenshots
01-hero-final.png
02-fleet-chosen.png
03-fleet-empty-filter.png
04-calculator-result.png
05-booking-no-estimate.png
06-booking-validation.png
07-booking-submitting.png
08-booking-success-stamp.png
09-booking-error.png
10-mobile-360.png
готово
```

HTML-отчёт Playwright — `npm run test:ui:report` (`playwright-report/` и
`test-results/` не коммитятся). Скриншотные эталоны лежат рядом со спеком
(`tests/e2e/visual.spec.mjs-snapshots/`); осознанная правка вёрстки обновляет их
командой `npx playwright test tests/e2e/visual.spec.mjs --update-snapshots` в
одном коммите с правкой.

Проверка смысла тестов «сломать → упадёт → восстановить → пройдёт» (требование
из задания; итоги v1 сохранены, для v2 повторён главный саботаж):

- убрали вывод текста ошибки поля → тест «пустые обязательные поля» упал, после
  восстановления — прошёл;
- убрали guard на время `submitting` (отключили `inFlightRef`) → строгий тест
  упал на `requests.length === 1`: Enter + `requestSubmit()` + повторные клики
  во время задержки дали второй запрос;
- убрали ветку `success` из guard-а → тест упал на числе запросов после
  подтверждения (программный `requestSubmit()` из `success` ушёл вторым);
- после восстановления обеих веток прогон снова зелёный — guard работает именно
  в двух состояниях, а не только в `submitting`.

## Использование AI при редизайне

Инструмент: agentic-сессии Claude / OpenCode, оформленные как башенные миссии
M1–M8 с независимым ревью на каждую. Формат: **промпт/задача → что сделал AI →
что исправил человек**. Фактура — из `.tower/comms/missions/M*.md` и ревью;
огромные тексты не копируются.

| Миссия | Задача/промпт | Вклад AI | Правки человека (ревью-циклы) |
|---|---|---|---|
| M1 | «Создай design-contract v2: токены, motion-язык, инварианты, карта web/» | токены, motion-бюджет, карта структуры, карта рубрики 12/12 | р1 P1: владелец разделяемого состояния (`state/rental.tsx` §4.5), scope/зависимости M5; р2 clean |
| M2 | «Укрепи baseline: just stop, README/REPORT» | `just stop` по `/proc/cmdline`, порты, формулировки guard-а | вне scope — findings (requirements python3 http.server); ревью clean |
| M3 | «Собери web/: Vite+React+TS+Tailwind+shadcn, слоты секций, /ui» | скелет, components/ui, AppProvider, alias `@legacy`, server /ui | р1 P1: `web/src/lib/utils.ts` не в коммите (lib/ в .gitignore) → сборка падала; P2: aria-invalid в CSS, transform при reduce, `--stroke-count`; р2 clean |
| M4 | «Переведи hero/fleet/calculator/info на React по контракту» | blueprint-сцена, карточки с выбором, калькулятор, reveal/hover | р1: ink-рамка выбранной карточки на hover, stagger ≤ 300 ms; findings: spacing-шкала tailwind ломает примитивы (компенсации до M6), favicon 404 |
| M5 | «Сделай state-machine заявки на React: состояния §6, guard §8, a11y §9» | `useBookingMachine`, api.ts, BookingSection/Fields/Snapshot/Result | р1 P2: shake на серверные 400/409/rejected, noscript в DOM; р2b P2: гонка `resetEstimate` + unavailable давала shake; р3 clean |
| M6 | «Переключи / на web/dist, мигрируй тесты и эталоны» | удаление legacy, SPA-fallback, e2e/визуальные спеки, favicon | р1 P2: при миграции потеряны проверки `role="status"` у `#booking-status`/`#fleet-count`; р2 clean |
| M7 | «Перерисуй mockup по контракту v2: 9 экранов + Движение» | 9 экранов сценария + кадры §3, CSS-аппроксимация shadcn | P3-наблюдения ревью приняты; требование — сверка с живым интерфейсом в M8 |
| M8 | «Пересобери отчёт и скриншоты под v2» | этот отчёт, `scripts/screenshots.mjs`, addendum requirements | — |

Сводно: AI сделал контракт, секции, машину заявки, миграцию тестов и макет;
человек проверял каждый шаг независимым ревью и дорабатывал — цикл «правка →
ревью → повтор» держался до чистого вердикта. Характерные исправления после
проверки: отказ от CDN и `@keyframes`/JS-вкладок в макете, реальный `disabled` у
полей «нет расчёта», синхронные ref-guard'ы вместо React-state для защиты от
двойной отправки, восстановленные проверки `role="status"`, компенсации
spacing-шкалы до правки конфига, классификация `unavailable` по исходному
состоянию при гонке `resetEstimate` («гонка shake»). Утилитарные правки вне
фронта: `just stop` убивает только свой `server.js` по `/proc/<pid>/cmdline`, а
не любой процесс на порту 8000.

## Критерии оценивания — где смотреть (карта 11 подкритериев)

| # | Критерий | Подтверждение |
|---|---|---|
| 1 | Макет создан с AI, доступен, отражает сценарий | `mockup/index.html` v2 (9 экранов + «Движение»), `mockup/README.md` |
| 2 | Использована библиотека компонентов | shadcn/ui + Tailwind: `web/src/components/ui/*`, секции `web/src/sections/*`, README «Стек» |
| 3 | Единые цвет/типографика/отступы | токены `web/src/styles/tokens.css` + `web/tailwind.config.js`, контракт §2, контраст-тест |
| 4 | Полный сценарий с реальным API | `tests/e2e/scenario.spec.mjs` (POST в `server.js` + GET-сверка созданной брони) |
| 5 | Интерфейс соответствует макету | экраны `mockup/` ↔ `docs/screenshots/01–10`, `mockup/screenshots/`; числа из `src/calc.js` |
| 6 | Подписи, клавиатура, фокус | e2e доступности + клавиатурный сценарий (дата программно из-за локали), фокус-индикаторы §9; скрины 05–06 |
| 7 | Защита от повторной отправки + тест | ref-guard в `submitting` и `success`; тест «submitting … ровно один POST, success — ноль новых», саботаж |
| 8 | Тесты компонентов и взаимодействий | `landing`/`calculator`/`booking-states` (фильтр, выбор, FAQ, Tab/Enter, повторная заявка) |
| 9 | Валидация форм | тесты «пустые обязательные поля», «некорректный телефон», срок пусто/0/31, 400 per-field, 409 |
| 10 | Состояния + подмена ответов | mock 201/500/409/битое тело/задержка, пустое состояние, спиннер, пустой фильтр |
| 11 | Тест основного сценария | `scenario.spec.mjs` на реальном API + скриншотные эталоны reduced-motion |

Условие раздела тестирования выполнено: `sh scripts/check.sh` и
`npx playwright test` (включая скриншотные с `reducedMotion: 'reduce'`) зелёные —
208 и 41.
