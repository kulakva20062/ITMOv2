---

description: "Task list for booking-ui implementation"
---

# Tasks: UI заявки на бронирование (booking-ui)

**Input**: Design documents from `specs/001-booking-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/ui-modules.md](./contracts/ui-modules.md),
[quickstart.md](./quickstart.md)

**Общий контракт**: [`specs/contracts/booking-contract.md`](../contracts/booking-contract.md) v1.0.0 —
источник имён полей, кодов, состояний и текстов.

**Tests**: тестовые задачи включены — это требование конституции (принцип II: логика в `src/` под
тестами; «Рабочий процесс»: новая логика идёт вместе с тестами в той же правке), а не опция.

**Organization**: задачи сгруппированы по пользовательским историям. Особенность фичи: все три
истории живут в одних и тех же пяти файлах, поэтому `[P]` стоит только там, где файлы действительно
разные.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можно делать параллельно (разные файлы, нет зависимости от незавершённых задач)
- **[Story]**: к какой истории относится задача (US1, US2, US3)
- Пути к файлам указаны в каждой задаче

## Чужие файлы — только чтение

`src/booking.js`, `src/booking-store.js`, `server.js`, `src/format.js`, `src/calc.js`, `src/cars.js`,
`docs/requirements.md`, `package.json`, `scripts/check.sh` и **все существующие тесты** не правятся.
Наши файлы: `src/booking-text.js`, `src/booking-form.js`, `src/main.js`, `index.html`, `styles.css`
и три новых файла тестов.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: убедиться, что база зелёная и чужой код даёт то, на что мы рассчитываем

- [X] T001 Прогнать `sh scripts/check.sh` и зафиксировать базовое число зелёных тестов до правок (ожидается 86+ с тестами команды 2)
- [X] T002 [P] Проверить, что `src/booking.js` экспортирует `validateBooking`, `ERROR_CODES`, `todayUtc`, `addDays`, `BOOKING_HORIZON_DAYS` (=365), `NAME_MIN_LENGTH` (=2), `NAME_MAX_LENGTH` (=60), и что в модуле нет `node:`-импортов (иначе он не загрузится в браузере)
- [X] T003 [P] Запустить `npm start` и убедиться, что `http://localhost:8000/` отдаёт страницу, а `POST /api/bookings` отвечает JSON — база для браузерных проверок

**Checkpoint**: база зелёная, чужие экспорты подтверждены

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: каркас, нужный всем трём историям: словарь текстов, слаги состояний, снимок расчёта, разметка, базовые стили

**⚠️ CRITICAL**: ни одна история не начинается, пока эта фаза не закрыта

### Тексты и состояния

- [X] T004 Создать `src/booking-text.js` с замороженным `BOOKING_TEXT`: ключи `section`, `labels` (`name` → «Имя», `phone` → «Телефон», `startDate` → «Дата начала аренды»), `hints` (подсказка телефона содержит заглушку `+7 000 000-00-00`), `buttons` (`submit` → «Отправить заявку», `submitting` → «Отправляем заявку…», `again` → «Оформить ещё одну заявку»), `states` (русские подписи пяти состояний §7), `noEstimate`, `stale`, `unavailable`, `rejected`, `success`, `conflictFallback` — состав по `contracts/ui-modules.md`
- [X] T005 Создать `tests/booking-text.test.js`: `BOOKING_TEXT` заморожен, все перечисленные ключи присутствуют и непусты, подсказка телефона содержит `+7 000 000-00-00`, подписи состояний покрывают все пять ключей `BOOKING_STATES`
- [X] T006 Создать `src/booking-form.js` с `BOOKING_STATES = { NO_ESTIMATE: 'no-estimate', EDITING: 'editing', SUBMITTING: 'submitting', SUCCESS: 'success', UNAVAILABLE: 'unavailable' }` и комментарием, что это производное имя по решению R-02 (§7 даёт только русские названия), строго 1:1 с подписями `BOOKING_TEXT.states`
- [X] T007 Добавить в `src/booking-form.js` чистую `snapshotView(estimate)` → `{ carModel, daysText, extrasText, totalText }`: модель из `src/cars.js`, суммы через `formatPrice`, подписи опций через `EXTRA_LABELS` из `src/calc.js`, пустой набор опций даёт «без опций», `estimate === null` → `null`
- [X] T008 Добавить в `src/booking-form.js` чистую `bookingPayload(estimate, draft)` → `{ carId, days, extras, name, phone, startDate }` строго по §4: `days` — число JSON (не строка), `extras` — массив (пустой выбор даёт `[]`), `phone` — как ввёл посетитель без нормализации; суммы, `endDate`, `id`, `status`, `createdAt` не включаются
- [X] T009 Создать `tests/booking-form.test.js` с покрытием T006–T008: слаги состояний, `snapshotView` на расчёте со опциями и без, `bookingPayload` содержит ровно шесть ключей и ни одной суммы, `days` имеет тип `number`

### Разметка и стили

- [X] T010 Добавить в `index.html` секцию `<section class="section" id="booking">` **между** `</section>` калькулятора и `<section id="benefits">`, по узлам из `contracts/ui-modules.md`: `#booking-form` (`<form novalidate>` с `data-state`), `#booking-snapshot`, поля `#booking-name` / `#booking-phone` / `#booking-date` (`type="date"`) с `label for`, подсказки `#booking-*-hint`, области ошибок `#booking-*-error` с `role="alert"`, `#booking-message`, `#booking-status` с `role="status"`, `#booking-submit` (`type="submit"`), `#booking-result`; у каждого поля `aria-describedby` на свою подсказку и свою ошибку. В статической разметке секции не использовать `data-car-id` (сломает существующий тест «автопарк строится скриптом»)
- [X] T011 Добавить ссылку «Заявка» на `#booking` в `<nav>` шапки `index.html`
- [X] T012 Создать `tests/booking-markup.test.js`: `#booking` стоит после `id="calculator"` и до `id="benefits"`; в `<nav>` есть `href="#booking"`; у трёх полей есть `label for`; три области ошибок имеют `role="alert"`; `#booking-status` имеет `role="status"`; каждый `aria-describedby` ссылается на существующий `id`; форма имеет `novalidate`
- [X] T013 Прогнать `sh scripts/check.sh` и убедиться, что **все существующие тесты остались зелёными** — особенно разбор поля срока в `tests/index.test.js` (риск разобран в research R-09); существующие тесты при этом не править

### Снимок расчёта и применение состояния

- [X] T014 В `src/main.js` ввести переменную модуля `estimate` (`null` при загрузке): заполнять `{ carId, days, extras, result }` в существующей `calculate()` только после успешного `calculateRental`, обнулять в существующей `clearResult()` (решение R-01) — второго источника состояния не создавать
- [X] T015 В `src/main.js` добавить тонкую `applyState(view)`: ставит `data-state` на `#booking-form`, переключает `disabled` у полей и кнопки, пишет подпись кнопки из `BOOKING_TEXT.buttons`, заполняет `#booking-status`, `#booking-message`, области ошибок и `#booking-result`. Ни одного условия про коды ошибок, состояния или формулировки — только применение готового описания (принцип II)
- [X] T016 В `src/main.js` ставить `min` = `todayUtc()` и `max` = `addDays(todayUtc(), BOOKING_HORIZON_DAYS)` на `#booking-date` при загрузке — числа в разметку не прошивать (решение R-06)

**Checkpoint**: каркас готов — разметка на месте, тексты и слаги есть, снимок расчёта живёт, `check.sh` зелёный

---

## Phase 3: User Story 1 — Отправить заявку по готовому расчёту (Priority: P1) 🎯 MVP

**Goal**: посетитель с готовым расчётом заполняет три поля, отправляет заявку и видит её номер

**Independent Test**: рассчитать аренду, заполнить корректные имя, телефон и дату, отправить — на экране номер `AD-0001`, модель, дата `ДД.ММ.ГГГГ`, срок и итог; телефона в подтверждении нет

### Tests for User Story 1

- [X] T017 [US1] Дополнить `tests/booking-form.test.js` тестами успешного пути: `responseView({ kind: 'json', status: 201, body })` → состояние `success` и заполненное `confirmation`; тот же `body` со `status: 200` даёт идентичный результат (FR-044); `confirmationView` берёт модель из `src/cars.js` по `booking.carId`, выводит дату через `formatDate` и итог через `formatPrice`, и **не содержит телефона**
- [X] T018 [US1] Дополнить `tests/booking-form.test.js` тестом FR-018: `price.total`, отличный от итога снимка, даёт непустое `correction` с обеими суммами; совпадающий — `correction === null`
- [X] T019 [US1] Дополнить `tests/booking-form.test.js` тестом `checkDraft` на корректном черновике: `{ ok: true, state: 'editing', fieldErrors: [], formMessage: null }`, проверка идёт через `validateBooking` команды 2 (своей проверки в модуле нет)

### Implementation for User Story 1

- [X] T020 [US1] Реализовать в `src/booking-form.js` `checkDraft(payload, today)` как обёртку над `validateBooking` из `src/booking.js` — счастливый путь и разбор `errors` на поля; ветки «устаревший снимок» и тексты ошибок оставить на US2
- [X] T021 [US1] Реализовать в `src/booking-form.js` `confirmationView(booking, snapshotTotal)` по `data-model.md` §6: `id` как есть, модель по `carId` из `src/cars.js`, `startDate` через `formatDate`, `total` через `formatPrice`, `correction` при расхождении с итогом снимка; обернуть `formatDate` защитой от `RangeError` (research R-09)
- [X] T022 [US1] Реализовать в `src/booking-form.js` `responseView(outcome)` — ветки `status` 201 и 200 → `success` через `confirmationView`; остальные исходы пока сводить к `unavailable` (полная таблица §7 — в US2)
- [X] T023 [US1] В `src/main.js` реализовать отправку формы: `preventDefault`, перевод в `submitting`, `bookingPayload` из снимка **на момент нажатия** (§4), `fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })` относительным путём (один источник, §1)
- [X] T024 [US1] В `src/main.js` обернуть `fetch` в `AbortController` с таймаутом 10 000 мс (§10), таймер снимать в `finally`; нормализовать исход в `{ kind: 'json', status, body }` либо `{ kind: 'timeout' | 'network' | 'unparsable' }` и передавать в `responseView` (решение R-05)
- [X] T025 [US1] В `src/main.js` показать подтверждение в `#booking-result`, скрыть поля и кнопку в состоянии `success`, вывести действие «Оформить ещё одну заявку» из `BOOKING_TEXT.buttons.again`
- [X] T026 [US1] В `src/main.js` реализовать «Оформить ещё одну заявку»: очистить три поля и вызвать существующую `clearResult()`, чтобы снимок обнулился и состояние стало `no-estimate` (решение R-10, FR-017)
- [X] T027 [US1] Прогнать `sh scripts/check.sh`; затем сценарии 1, 2, 8, 9 из [quickstart.md](./quickstart.md) в браузере через MCP playwright

**Checkpoint**: заявку можно отправить и получить номер — это работающий MVP

---

## Phase 4: User Story 2 — Исправить ошибки и занятые даты (Priority: P2)

**Goal**: каждая ошибка показана у своего поля текстом из каталога §7, введённое не теряется, отправить можно снова

**Independent Test**: отправить форму с пустыми полями, именем `Иван123`, телефоном `123`, датой на +400 суток и датой занятого интервала — в каждом случае ровно тот текст, что задан каталогом §7, у нужного поля

### Tests for User Story 2

- [X] T028 [P] [US2] Дополнить `tests/booking-text.test.js`: `errorView` для **каждой** из 17 строк каталога §7 отдаёт ожидаемый `{ scope, field, state, text }`; обе ветки `name_length` («слишком короткое» при `length < NAME_MIN_LENGTH`, иначе «слишком длинное»); `date_too_far` подставляет 365 из `BOOKING_HORIZON_DAYS`, а не прошитое число; нераспознанный код и нераспознанное имя поля дают «Заявка не принята. Проверьте поля и отправьте ещё раз.» без исключения
- [X] T029 [P] [US2] Дополнить `tests/booking-form.test.js` тестом `conflictText`: контрольный пример `{ startDate: '2026-11-10', endDate: '2026-11-13' }` → «Эта машина занята с 10.11.2026 по 12.11.2026. Выберите другую дату начала или другую машину.» (последний занятый день, §8); отсутствующий, неполный и нечитаемый `conflict` → `BOOKING_TEXT.conflictFallback`, исключение наружу не выходит
- [X] T030 [P] [US2] Дополнить `tests/booking-form.test.js` тестами `responseView` на отказах: `409` → ошибка у `startDate`; `400 validation_failed` с кодами `name`/`phone`/`startDate` → `editing` с ошибками полей в порядке контракта; `400` с кодом по `carId`/`days`/`extras` → `no-estimate` и `formMessage` «Расчёт устарел…»; смешанный ответ (и поля, и снимок) → побеждает `no-estimate` (решение R-04); `invalid_json`, `415`, `413`, `405`, `404` и нераспознанный код → `editing` с общим сообщением; `500`, `kind: 'timeout'`, `'network'`, `'unparsable'` → `unavailable`
- [X] T031 [P] [US2] Дополнить `tests/booking-form.test.js` тестом устойчивости: `responseView` не бросает исключений на ответах без `body.error`, с пустым `fields`, с `conflict` чужой формы и с `status`, которого нет в таблице

### Implementation for User Story 2

- [X] T032 [US2] Реализовать в `src/booking-text.js` `errorView(code, field, context = {})` по каталогу §7: коды берутся из `ERROR_CODES` модуля `src/booking.js` (не строковыми литералами), `context.length` выбирает ветку `name_length`, `context.horizon` по умолчанию равен `BOOKING_HORIZON_DAYS`, коды полей `carId`/`days`/`extras` → `{ scope: 'form', state: 'no-estimate', text: BOOKING_TEXT.stale }`, нераспознанный код или поле → `{ scope: 'form', state: 'editing', text: BOOKING_TEXT.rejected }`
- [X] T033 [US2] Реализовать в `src/booking-form.js` `conflictText(conflict)`: последний занятый день `addDays(conflict.endDate, -1)` через `formatDate` (§8), с защитой от `RangeError` обеих функций и откатом на `BOOKING_TEXT.conflictFallback` (research R-09)
- [X] T034 [US2] Достроить `checkDraft` в `src/booking-form.js`: ошибки по `name`/`phone`/`startDate` → `state: 'editing'` и `fieldErrors` через `errorView` с подсчётом длины имени для `name_length` (решение R-08); хотя бы одна ошибка по `carId`/`days`/`extras` → `state: 'no-estimate'`, `formMessage: BOOKING_TEXT.stale`, `fieldErrors: []`
- [X] T035 [US2] Достроить `responseView` в `src/booking-form.js` до полной таблицы §7 в порядке решения R-04: 201/200 → `success`; 409 → ошибка даты через `conflictText`; 400 `validation_failed` → разбор `error.fields` с приоритетом «снимок устарел»; 5xx и не-`json` исходы → `unavailable`; всё прочее → `editing` с общим сообщением. `error.message` из ответа не использовать нигде (FR-028, SC-011)
- [X] T036 [US2] В `src/main.js` вызывать `checkDraft` до отправки: при `ok === false` запрос не отправлять, применить описание через `applyState` (FR-021)
- [X] T037 [US2] В `src/main.js` снимать ошибку поля по событию `input` на **этом** поле, не затрагивая ошибки других полей и общее сообщение (FR-022)
- [X] T038 [US2] В `src/main.js` сохранять введённые имя, телефон и дату при ошибках, при `unavailable` и при переходе в `no-estimate` по устаревшему снимку (FR-015, FR-019, FR-043)
- [X] T039 [US2] Прогнать `sh scripts/check.sh`; затем сценарии 3–7, 10–15 из [quickstart.md](./quickstart.md) через MCP playwright, включая конфликт дат на чистом хранилище и повторную идентичную заявку (§9)

**Checkpoint**: US1 и US2 работают независимо; все 17 строк каталога §7 достижимы

---

## Phase 5: User Story 3 — Доступная и адаптивная форма (Priority: P3)

**Goal**: форма проходится клавиатурой и экранным читателем в каждом состоянии и читается на 360 и 1280 px

**Independent Test**: пройти форму только клавиатурой в каждом из пяти состояний; на 360 и 1280 px убедиться, что горизонтальной прокрутки нет

### Tests for User Story 3

- [X] T040 [P] [US3] Дополнить `tests/booking-markup.test.js`: области ошибок и состояния присутствуют в разметке постоянно и пусты изначально (FR-034); у каждого поля `aria-describedby` содержит и свою подсказку, и свою ошибку; кнопка имеет `type="submit"`

### Implementation for User Story 3

- [X] T041 [US3] В `src/main.js` ставить `aria-invalid="true"` на поле с ошибкой и **удалять** атрибут при её снятии (FR-030)
- [X] T042 [US3] В `src/main.js` переводить фокус на первое поле с ошибкой в визуальном порядке (имя, телефон, дата) после отправки с ошибками; область `role="status"` фокус не перехватывает (FR-023, FR-033)
- [X] T043 [US3] В `src/main.js` выключать поля и кнопку через `disabled` в состояниях `no-estimate` и `submitting`, чтобы они выпадали из обхода клавиатурой (FR-036)
- [X] T044 [US3] Добавить в `styles.css` блок стилей секции заявки по `docs/style-guide.md`: только токены `--paper`, `--ink`, `--ink-2`, `--rule`, `--signal`, `--stamp`; текст ошибки цветом `--stamp` по образцу `.calc__error`; переиспользовать существующие `.field`, `.field__label`, `.field__control`, `.button` и уже готовое правило `.field__control[aria-invalid='true']`; без теней, градиентов и анимации; `border-radius` 0 у полей, 2px у кнопки
- [X] T045 [US3] В `styles.css` довести раскладку до 1280 px: поля не растянуты на всю ширину, рейка с подписью секции слева как в соседних секциях, снимок и поля читаются одним листом (FR-040)
- [X] T046 [US3] В `styles.css` довести раскладку до 360 px в существующих `@media (max-width: 60rem)` и `@media (max-width: 30rem)`: одна колонка, снимок над полями, подписи над полями, кнопка по ширине колонки, высота касания полей, кнопки и ссылки не меньше 44 px, без горизонтальной прокрутки (FR-038, FR-039)
- [X] T047 [US3] В `styles.css` обеспечить перенос или усечение длинных значений: имя из 60 символов, длинная модель, номер вида `AD-10000` не выходят за границы секции на обеих ширинах (FR-041)
- [X] T048 [US3] Прогнать `sh scripts/check.sh`; затем сценарий 16 и все проверки ширин из [quickstart.md](./quickstart.md) через MCP playwright на 360×800 и 1280×900, включая `document.documentElement.scrollWidth <= window.innerWidth` в каждом из пяти состояний

**Checkpoint**: все три истории работают независимо

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T049 Проверить, что в `src/main.js` не осталось ни одного условия про код ошибки, состояние или формулировку — всё решают чистые функции (принцип II; признак незавершённости из quickstart §5)
- [X] T050 Проверить, что в `index.html` и `styles.css` нет ни одной видимой строки текста формы, которой нет в `src/booking-text.js` (FR-028)
- [X] T051 [P] Проверить, что в `styles.css` не появилось новых цветов вне токенов `:root`, и что `--stamp` используется только для ошибок ввода
- [X] T052 [P] Прогнать скилл `landing-check` — статический аудит правил AGENTS.md, `docs/style-guide.md` и контраста
- [X] T053 Прогнать [quickstart.md](./quickstart.md) целиком: 16 сценариев на 360 и 1280 px, и сверить результат с критериями SC-001…SC-011 спецификации
- [X] T054 Финальный `sh scripts/check.sh` — зелёный, и число тестов выросло ровно на добавленные, существующие не правились

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: без зависимостей
- **Foundational (Phase 2)**: зависит от Setup — **блокирует все истории**
- **US1 (Phase 3)**: зависит только от Foundational
- **US2 (Phase 4)**: зависит от Foundational; T034 и T035 достраивают функции, начатые в T020 и T022
- **US3 (Phase 5)**: зависит от Foundational; полнее всего проверяется после US2, когда достижимы все состояния
- **Polish (Phase 6)**: после всех нужных историй

### User Story Dependencies

- **US1 (P1)**: независима — после Foundational даёт работающую отправку заявки
- **US2 (P2)**: независимо тестируема, но трогает те же `src/booking-form.js` и `src/main.js`, что US1 → **одновременно с US1 одним человеком не делается**
- **US3 (P3)**: независимо тестируема; `styles.css` не пересекается с файлами US1/US2, поэтому T044–T047 можно делать параллельно с US2

### Parallel Opportunities

- T002 и T003 — параллельно (разные проверки)
- T028–T031 — параллельно между собой: это разные файлы тестов и независимые наборы случаев
- T044–T047 (`styles.css`) — параллельно с задачами US2 в `src/booking-form.js` и `src/main.js`
- T051 и T052 — параллельно

**Чего параллелить нельзя**: задачи внутри одного файла. `src/booking-form.js` правят T006–T008,
T020–T022, T033–T035; `src/main.js` — T014–T016, T023–T026, T036–T038, T041–T043. Внутри каждой
группы порядок последовательный.

---

## Parallel Example: User Story 2

```bash
# Тесты US2 — разные файлы и независимые наборы случаев:
Task: "T028 errorView на всех 17 строках каталога §7 в tests/booking-text.test.js"
Task: "T029 conflictText на контрольном примере и битом conflict в tests/booking-form.test.js"
Task: "T030 responseView на всех отказах в tests/booking-form.test.js"
Task: "T031 устойчивость responseView к битым ответам в tests/booking-form.test.js"

# Параллельно с ними — вёрстка US3, другой файл:
Task: "T044 стили секции заявки в styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup — база зелёная, чужие экспорты подтверждены
2. Phase 2: Foundational — **критично, блокирует всё**
3. Phase 3: US1 — отправка заявки и номер на экране
4. **СТОП и проверка**: сценарии 1, 2, 8, 9 quickstart на 360 и 1280 px
5. Это демонстрируемый результат: посетитель может забронировать машину

### Incremental Delivery

1. Setup + Foundational → каркас готов
2. + US1 → заявка отправляется, номер виден (MVP)
3. + US2 → ошибки, занятые даты, устаревший расчёт, недоступный сервер
4. + US3 → доступность и обе ширины
5. Phase 6 → сквозная проверка и аудит

Каждый шаг заканчивается зелёным `sh scripts/check.sh` (принцип III) и не ломает сценарии фич A, B и C.

---

## Notes

- Коммит делает студент после приёмки — агент не коммитит и не пушит (AGENTS.md).
- Коды ошибок импортируются из `ERROR_CODES`, а не пишутся строками: это требование принципа V.
- Существующие тесты не правятся ни при каком результате; если новая разметка их ломает — правится
  разметка (риск разобран в research R-09).
- Контракт `specs/contracts/booking-contract.md` не меняется: расхождение кода с контрактом правится
  по контракту, а не наоборот.
- Единственное производное имя фичи — слаги `BOOKING_STATES` (T006); при следующей правке контракта
  сверить с командой 2.
