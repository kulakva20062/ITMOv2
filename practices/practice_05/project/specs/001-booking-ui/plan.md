# Implementation Plan: UI заявки на бронирование (booking-ui)

**Branch**: `2026_Kulakovskii_Vlad_practies_5` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-booking-ui/spec.md`

**Общий контракт**: [`specs/contracts/booking-contract.md`](../contracts/booking-contract.md) v1.0.0 — источник имён
полей, кодов ошибок, состояний и видимых текстов. Логика и API уже реализованы командой 2
(`src/booking.js`, `src/booking-store.js`, `server.js`); эти файлы **читаются и импортируются, но не правятся**.

## Summary

Добавить на лендинг секцию `#booking` сразу после итога калькулятора: снимок расчёта (только чтение),
три поля — имя, телефон, дата начала аренды, — и отправку заявки на `POST /api/bookings` с показом
номера заявки.

Технический подход: вся переводимая в текст логика — две новые чистые функции-библиотеки
`src/booking-text.js` (видимые строки) и `src/booking-form.js` (выбор состояния, сборка запроса,
разбор ответа), покрытые `node --test`. Проверка значений **не пишется заново** — переиспользуется
`validateBooking` из `src/booking.js` команды 2, то есть UI и сервер проверяют форму одним предикатом.
`src/main.js` остаётся тонкой связкой с DOM: читает поля, вызывает чистые функции, расставляет
атрибуты, делает `fetch` с таймаутом. Разметка — в `index.html`, стили — в `styles.css` по
`docs/style-guide.md` без новых токенов. Браузерная проверка — MCP playwright на 360 и 1280 px.

## Technical Context

**Language/Version**: ES-модули (ES2022), Node 24 для тестов, браузер для исполнения

**Primary Dependencies**: нет и не появится — ни npm-пакетов, ни сборщика, ни фреймворка (принцип I).
Внутренние импорты: `src/booking.js` (`validateBooking`, `ERROR_CODES`, `todayUtc`, `addDays`,
`BOOKING_HORIZON_DAYS`, `NAME_MIN_LENGTH`, `NAME_MAX_LENGTH`), `src/format.js` (`formatPrice`,
`formatDate`), `src/cars.js` (`cars`), `src/calc.js` (`EXTRA_LABELS`)

**Storage**: на стороне UI — ничего. Ни `localStorage`, ни `sessionStorage`, ни URL-состояния:
снимок расчёта и черновик живут в памяти модуля `src/main.js` до перезагрузки страницы

**Testing**: `node --test` через `sh scripts/check.sh` (единственный раннер, принцип III) + браузерные
сценарии через MCP playwright на 360 и 1280 px

**Target Platform**: современный браузер (Chromium для проверки), страница и API с одного источника
`http://localhost:8000` — один процесс `npm start`

**Project Type**: статический одностраничный лендинг + уже готовый API того же процесса

**Performance Goals**: отправка укладывается в бюджет контракта §10 — сервер отвечает ≤ 2 с, UI ждёт
10 с; перерисовка секции — без заметной задержки, новой анимации не добавляется

**Constraints**: без внешних ресурсов и сети, кроме своего `/api` (принцип IV); только токены
`:root`; `--stamp` только для ошибок ввода; без теней, градиентов и новой анимации; нет
горизонтальной прокрутки на 360 px; контраст AA

**Scale/Scope**: одна новая секция страницы, 5 состояний формы, 3 поля, 17 строк каталога §7,
два новых модуля `src/` и три новых файла тестов

## Constitution Check

*GATE: пройден до Phase 0, перепроверен после Phase 1.*

| Принцип | Как выполняется | Статус |
|---|---|---|
| I. Чистый стек без зависимостей | Новых зависимостей нет; `package.json` не меняется; только ES-модули и встроенный `node --test`. `fetch` — штатный браузерный API | ✅ |
| II. Логика — чистые функции в `src/` под тестами | Выбор состояния, сборка запроса, разбор ответа и все тексты — в `src/booking-text.js` и `src/booking-form.js`; к DOM, часам, сети и случайности они не обращаются, «сегодня» приходит параметром. `src/main.js` остаётся связкой без решений | ✅ |
| III. Зелёный `scripts/check.sh` | Раннер прогоняется после каждой правки; новые тесты добавляются вместе с кодом в той же правке | ✅ |
| IV. Только вымышленные данные, без внешних ресурсов | Подсказка телефона — заглушка `+7 000 000-00-00`; запросы только к своему `/api/bookings` относительным путём; картинок и шрифтов из сети нет | ✅ |
| V. Контракт до кода — единственный источник имён | Коды ошибок берутся из `ERROR_CODES` модуля команды 2 (не переписываются строками), поля запроса — из §4, тексты — из каталога §7, проверка — тем же `validateBooking` | ⚠️ одно производное имя, см. ниже |

**Единственное производное имя.** Контракт §7 называет состояния по-русски («нет расчёта»,
«заполнение», «отправка», «успех», «сервер недоступен»), но машиночитаемого значения для
`data`-атрибута не задаёт, а FR-020 его требует. Решение: ASCII-слаги
`no-estimate | editing | submitting | success | unavailable` объявляются **один раз** в
`src/booking-form.js` как `BOOKING_STATES`, строго 1:1 с русскими названиями §7, а русская подпись
лежит в `BOOKING_TEXT.states`. Новых состояний не вводится. Это расширение контракта в его терминах,
а не второе имя; зафиксировано в [research.md](./research.md) (R-02) и в
[contracts/ui-modules.md](./contracts/ui-modules.md) как предмет сверки с командой 2.

Остальных нарушений нет; раздел «Complexity Tracking» не заполняется.

**Проверка после Phase 1**: состав артефактов принципы не нарушил. Новых модулей ровно два, оба —
чистые функции; третий файл (`src/main.js`) уже существует и только дополняется связкой.

## Project Structure

### Documentation (this feature)

```text
specs/001-booking-ui/
├── spec.md              # Спецификация (готова, согласована с контрактом)
├── plan.md              # Этот файл
├── research.md          # Phase 0: 10 решений по неочевидным местам
├── data-model.md        # Phase 1: сущности UI и автомат состояний
├── quickstart.md        # Phase 1: как проверить фичу руками и в браузере
├── contracts/
│   └── ui-modules.md    # Phase 1: публичный интерфейс двух новых модулей src/
├── checklists/
│   └── requirements.md  # Чек-лист качества спецификации
└── tasks.md             # Phase 2 (/speckit-tasks — этим файлом не создаётся)
```

### Source Code (repository root)

```text
index.html                      # + <section id="booking"> между #calculator и #benefits, + ссылка в <nav>
styles.css                      # + блок стилей секции заявки, правки в @media 60rem / 30rem
src/
├── booking-text.js             # НОВЫЙ (наш): BOOKING_TEXT, errorView(code, field, context)
├── booking-form.js             # НОВЫЙ (наш): BOOKING_STATES, снимок, сборка запроса, разбор ответа
├── main.js                     # ПРАВИМ (наш): связка с DOM, fetch, таймаут 10 с
├── booking.js                  # ЧУЖОЙ (команда 2): импортируем validateBooking, ERROR_CODES, addDays…
├── booking-store.js            # ЧУЖОЙ, серверный: UI его не импортирует
├── format.js                   # ЧУЖОЙ (дополнен formatDate): импортируем formatPrice, formatDate
├── calc.js, cars.js            # существующие, не меняются
├── filter.js, render.js        # существующие, не меняются
tests/
├── booking-text.test.js        # НОВЫЙ: все 17 строк каталога §7, обе ветки name_length
├── booking-form.test.js        # НОВЫЙ: автомат состояний, сборка запроса, разбор ответов
└── booking-markup.test.js      # НОВЫЙ: разметка #booking, label, aria-*, порядок узлов
server.js                       # ЧУЖОЙ (команда 2): не меняется
```

**Structure Decision**: раскладка проекта не меняется — плоский `src/` рядом с `index.html`, как в
фичах A/B/C. Новые тесты кладутся **отдельными файлами**, существующие (`tests/index.test.js` и др.)
не правятся: по AGENTS.md существующие тесты не переписываются, а `check.sh` подхватывает
`tests/**/*.test.js` сам.

### Чужой код: что импортируем и чего не трогаем

| Файл | Наше действие | Что берём |
|---|---|---|
| `src/booking.js` | только импорт | `validateBooking`, `ERROR_CODES`, `addDays`, `todayUtc`, `BOOKING_HORIZON_DAYS`, `NAME_MIN_LENGTH`, `NAME_MAX_LENGTH` |
| `src/format.js` | только импорт | `formatPrice`, `formatDate` |
| `src/calc.js`, `src/cars.js` | только импорт | `EXTRA_LABELS`, `cars` |
| `src/booking-store.js`, `server.js` | не импортируем и не правим | — |
| `docs/requirements.md` | не правим | «Фича D» уже добавлена командой 2 |
| `package.json` | не правим | `scripts.start` уже `node server.js` |

## Этапы реализации (для `/speckit-tasks`)

1. **Тексты** — `src/booking-text.js` + `tests/booking-text.test.js`: каталог §7 целиком, строки формы,
   подписи состояний. Зависимостей от остального нет, делается первым.
2. **Состояния и обмен** — `src/booking-form.js` + `tests/booking-form.test.js`: `BOOKING_STATES`,
   `snapshotView`, `bookingPayload`, `checkDraft`, `responseView`, `confirmationView`.
3. **Разметка** — секция `#booking` в `index.html`, ссылка в `<nav>` + `tests/booking-markup.test.js`.
4. **Стили** — `styles.css` по `docs/style-guide.md`, включая 360 и 1280 px.
5. **Связка** — `src/main.js`: снимок расчёта, обработчик отправки, `fetch` с `AbortController`,
   применение результата чистых функций к DOM.
6. **Браузерная проверка** — MCP playwright на 360 и 1280 px по [quickstart.md](./quickstart.md).

Порядок обязателен только в части «чистые функции до связки»: шаги 3 и 4 независимы от 1–2.

## Риски и как они закрыты

| Риск | Закрытие |
|---|---|
| Новый `<input>` в разметке сломает существующие тесты калькулятора — `tests/index.test.js` ищет поле срока регуляркой от **первого** `<input>` в документе | Секция `#booking` ставится **после** `#calculator`, поэтому все её поля идут ниже `#calc-days`. Проверено: ни один существующий тест не ломается (разбор в [research.md](./research.md) R-09) |
| Расхождение текстов UI с каталогом §7 | Тесты `booking-text.test.js` перечисляют все 17 строк каталога; тексты не дублируются в разметке |
| Своя проверка полей разойдётся с серверной | Своей проверки нет: `checkDraft` вызывает `validateBooking` команды 2 |
| Полуоткрытый интервал покажут посетителю как есть | `conflictText` строится через `addDays(conflict.endDate, -1)`; тест фиксирует пример `[2026-11-10, 2026-11-13)` → «с 10.11.2026 по 12.11.2026» |
| Новые цвета или тени в вёрстке | Стили только на существующих токенах; `aria-invalid` уже оформлен в `styles.css`, переиспользуется |
| Залипание кнопки при обрыве сети | `AbortController` + таймаут 10 с всегда возвращает форму в состояние «заполнение» или «сервер недоступен» |
