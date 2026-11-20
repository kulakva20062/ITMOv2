# Phase 1 — UI Contract: публичный интерфейс новых модулей `src/`

Это **не** второй контракт обмена с сервером: обмен задан
[`specs/contracts/booking-contract.md`](../../contracts/booking-contract.md) v1.0.0 и здесь не
переопределяется. Этот документ фиксирует публичную поверхность двух новых модулей UI — то, что
будут вызывать `src/main.js` и тесты. Все имена кодов, полей и формулировок выводятся из контракта.

**Правило зависимостей**: оба модуля — чистые функции. Ни `document`, ни `window`, ни `fetch`,
ни `Date.now()`, ни `Math.random()`. «Сегодня» и длины приходят параметрами.

---

## `src/booking-text.js`

Все видимые строки формы. Единственный источник формулировок для UI (FR-028).

### `BOOKING_TEXT`

Замороженный объект. Состав:

| Ключ | Содержимое |
|---|---|
| `section` | заголовок секции, рейка, пояснение под заголовком |
| `labels` | подписи полей: `name`, `phone`, `startDate` |
| `hints` | подсказки полей, включая образец `+7 000 000-00-00` |
| `buttons` | `submit`, `submitting`, `again` |
| `states` | русские подписи пяти состояний §7, по ключам `BOOKING_STATES` |
| `noEstimate` | объяснение «сначала рассчитайте аренду» + подпись ссылки на `#calculator` |
| `stale` | «Расчёт устарел — пересчитайте стоимость в калькуляторе.» |
| `unavailable` | «Заявка не отправлена — сервер не ответил. Проверьте связь и нажмите «Отправить заявку» ещё раз.» |
| `rejected` | «Заявка не принята. Проверьте поля и отправьте ещё раз.» |
| `success` | подписи строк подтверждения и шаблон уточнения итога |
| `conflictFallback` | «Эта машина уже занята на выбранные даты. Выберите другую дату начала или другую машину.» |

### `errorView(code, field, context = {})`

Возвращает `{ scope, field, state, text }` (см. `data-model.md` §5), где `scope` —
`'field'` (рядом с полем), `'form'` (общее сообщение над кнопкой) или `'status'`
(область `role="status"`: туда уходит «сервер недоступен»).

| Параметр | Назначение |
|---|---|
| `code` | значение из `ERROR_CODES` модуля `src/booking.js`, либо `error.code` ответа |
| `field` | имя поля из ответа или `null` |
| `context` | `{ length }` для `name_length`; `{ horizon }` для `date_too_far`; `{ from, to }` для `date_conflict` |

Поведение:

- Возвращает строку каталога §7, соответствующую паре «код + поле».
- `name_length` выбирает ветку по `context.length` относительно `NAME_MIN_LENGTH` (решение R-08).
- `date_too_far` подставляет `context.horizon`, по умолчанию `BOOKING_HORIZON_DAYS`.
- Коды полей `carId` / `days` / `extras` → `{ scope: 'form', state: 'no-estimate', text: BOOKING_TEXT.stale }`.
- Нераспознанный код **или** нераспознанное имя поля → `{ scope: 'form', state: 'editing', text: BOOKING_TEXT.rejected }`. Исключений не бросает: неизвестный код — ожидаемый вход.

---

## `src/booking-form.js`

Состояния, сборка запроса, разбор ответа.

### `BOOKING_STATES`

```text
{ NO_ESTIMATE: 'no-estimate', EDITING: 'editing', SUBMITTING: 'submitting',
  SUCCESS: 'success', UNAVAILABLE: 'unavailable' }
```

Слаги внесены владельцем в контракт §7 и больше не являются производным именем UI.
**Объявлены в `src/booking-text.js`** рядом с русскими подписями `BOOKING_TEXT.states` и
реэкспортируются отсюда: обратный порядок дал бы кольцевой импорт между двумя модулями.

### `statePresentation(state)`

`{ locked, done, dropsEstimate, buttonLabel, stateLabel }` — как состояние отражается на форме.
Нужна, чтобы последнее решение («что заблокировать, что скрыть, что на кнопке») не утекло в
связку с DOM: `src/main.js` только применяет флаги. Чужое состояние даёт пустой `stateLabel`.

### `snapshotView(estimate)`

`Estimate` → `{ carModel, daysText, extrasText, totalText }` для блока «только чтение».
Суммы — через `formatPrice`, подписи опций — из `EXTRA_LABELS`. Пустой набор опций даёт «без опций».
`estimate === null` → `null`.

### `bookingPayload(estimate, draft)`

`(Estimate, { name, phone, startDate })` → тело запроса по §4 (см. `data-model.md` §3).
Суммы, `endDate` и служебные поля не включает. `days` — число.

### `checkDraft(payload, today)`

Обёртка над `validateBooking` команды 2 — **своей проверки не содержит**.

Возвращает `{ ok, state, fieldErrors, formMessage }`:

- всё прошло → `{ ok: true, state: 'editing', fieldErrors: [], formMessage: null }`;
- ошибки только по `name`/`phone`/`startDate` → `ok: false`, `state: 'editing'`, `fieldErrors`
  в порядке контракта;
- есть хотя бы одна ошибка по `carId`/`days`/`extras` → `ok: false`, `state: 'no-estimate'`,
  `formMessage: BOOKING_TEXT.stale`, `fieldErrors: []` (приоритет из решения R-04, пункт 3).

Длина имени для ветки `name_length` считается здесь и передаётся в `errorView` через `context`.

### `responseView(outcome)`

Главная функция фичи: исход обращения → что показать. Вход нормализует `src/main.js`:

| Вход | Значение |
|---|---|
| `{ kind: 'json', status, body }` | сервер ответил и тело разобрано |
| `{ kind: 'timeout' }` | истекли 10 с (§10) |
| `{ kind: 'network' }` | `fetch` не дошёл |
| `{ kind: 'unparsable' }` | ответ пришёл, но тело не разобрано |

Второй аргумент — `options`: `{ snapshotTotal, length }` (итог снимка для сверки по FR-018 и длина
имени для ветки `name_length`).

Возвращает `{ state, fieldErrors, formMessage, statusMessage, confirmation }`, где `statusMessage`
идёт в область `role="status"` (отправка, успех, недоступность), а `formMessage` — в общее
сообщение над кнопкой. Решающая таблица — §7 контракта, порядок разбора — решение R-04.
Исключений не бросает ни на одном входе, включая отсутствующие `body.error`, пустой `fields`,
чужой `conflict` и нечитаемое тело успеха.

### `conflictText(conflict)`

`{ carId, startDate, endDate }` → текст строки `date_conflict` §7, где называется **последний
занятый день** `addDays(conflict.endDate, -1)` в формате `formatDate` (§8).

Контрольный пример, который обязан быть в тестах: `[2026-11-10, 2026-11-13)` → «Эта машина занята
с 10.11.2026 по 12.11.2026. Выберите другую дату начала или другую машину.»

Отсутствующий, неполный или нечитаемый `conflict` (`addDays`/`formatDate` бросают `RangeError`,
см. research R-09) → `BOOKING_TEXT.conflictFallback`. Наружу исключение не выходит.

### `confirmationView(booking, snapshotTotal)`

Тело `201`/`200` → данные подтверждения (см. `data-model.md` §6). Модель машины берётся из
`src/cars.js` по `booking.carId`, не из текста ответа. Телефон не включается.
`booking.price.total !== snapshotTotal` → заполненное поле `correction`, иначе `null`.

---

## Контракт разметки (что гарантирует `index.html` тестам и `src/main.js`)

| Селектор | Роль |
|---|---|
| `#booking` | секция, между `#calculator` и `#benefits`, ссылка на неё есть в `<nav>` |
| `#booking-form` | `<form novalidate>`, несёт `data-state` со слагом `BOOKING_STATES` |
| `#booking-snapshot` | блок снимка расчёта, только чтение |
| `#booking-name`, `#booking-phone`, `#booking-date` | поля; у каждого свой `label for` |
| `#booking-name-hint`, `#booking-phone-hint`, `#booking-date-hint` | подсказки, связаны через `aria-describedby` |
| `#booking-name-error`, `#booking-phone-error`, `#booking-date-error` | ошибки полей, `role="alert"`, в `aria-describedby` того же поля |
| `#booking-message` | общее сообщение над кнопкой |
| `#booking-status` | область состояния, `role="status"` |
| `#booking-submit` | кнопка отправки, `type="submit"` |
| `#booking-result` | подтверждение после успеха |

Все перечисленные узлы присутствуют в разметке **постоянно** и пустуют, когда сообщать нечего
(FR-034). `data-car-id` в статической разметке секции не используется — иначе сломается
существующий тест «автопарк строится скриптом из src/cars.js».
