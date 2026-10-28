// Склейка данных и разметки: автопарк и калькулятор строятся из src/cars.js.
// Решения по заявке здесь не принимаются: состояние и тексты дают чистые функции
// из src/booking-form.js и src/booking-text.js, этот модуль только применяет результат.
import { cars, CAR_CLASSES, GEARBOXES, CLASS_LABELS, GEARBOX_LABELS } from './cars.js';
import { fleetHtml, carOptionsHtml, extrasFieldsHtml, receiptHtml } from './render.js';
import { formatPrice } from './format.js';
import { calculateRental } from './calc.js';
import { filterCars, filterOptionsHtml, countLabel, EMPTY_MESSAGE } from './filter.js';
import { BOOKING_HORIZON_DAYS, addDays, todayUtc } from './booking.js';
import { BOOKING_STATES, BOOKING_TEXT } from './booking-text.js';
import {
  bookingPayload,
  checkDraft,
  responseView,
  snapshotView,
  statePresentation,
} from './booking-form.js';

const list = document.getElementById('fleet-list');
const status = document.getElementById('fleet-status');

const fleetHead = document.querySelector('.fleet__head');
const classFilter = document.getElementById('fleet-filter-class');
const gearboxFilter = document.getElementById('fleet-filter-gearbox');
const countBox = document.getElementById('fleet-count');

const form = document.getElementById('calc-form');
const carField = document.getElementById('calc-car');
const daysField = document.getElementById('calc-days');
const extrasBox = document.getElementById('calc-extras');
const errorBox = document.getElementById('calc-error');
const resultBox = document.getElementById('calc-result');

// Список калькулятора всегда полный: фильтр реестра его не касается.
if (carField && extrasBox) {
  carField.innerHTML = carOptionsHtml(cars, cars[0]?.id);
  extrasBox.innerHTML = extrasFieldsHtml();
}

// Опции фильтра: «любой» первым и выбранным, подписи — из словарей автопарка.
if (classFilter) {
  classFilter.innerHTML = filterOptionsHtml(CAR_CLASSES, CLASS_LABELS, 'Любой класс');
}

if (gearboxFilter) {
  gearboxFilter.innerHTML = filterOptionsHtml(GEARBOXES, GEARBOX_LABELS, 'Любая коробка');
}

// Выбор живёт здесь, а не в DOM: перерисовка реестра сносит отметку, а значение
// селекта калькулятора непусто с самой загрузки и выбором машины не является.
let chosenCarId = null;

// Отметка выбранной машины в реестре — одна строка за раз.
function markChosen(carId) {
  if (!list) return;
  for (const row of list.querySelectorAll('[data-chosen]')) {
    delete row.dataset.chosen;
  }
  if (!carId) return;
  list.querySelector(`[data-car-id="${carId}"]`)?.setAttribute('data-chosen', 'true');
}

// Единственный путь вывода реестра: и строки машин, и пустой результат идут сюда.
function renderFleet() {
  if (!list) return;

  const shown = filterCars(cars, {
    carClass: classFilter?.value,
    gearbox: gearboxFilter?.value,
  });

  list.innerHTML = shown.length
    ? fleetHtml(shown)
    : `<p class="fleet__empty">${EMPTY_MESSAGE}</p>`;

  // Шапка реестра лежит вне #fleet-list, её видимость переключаем сами.
  if (fleetHead) fleetHead.hidden = shown.length === 0;
  if (countBox) countBox.textContent = countLabel(shown.length, cars.length);

  // Отфильтрованная выбранная машина отметки не получает — её строки просто нет.
  markChosen(chosenCarId);
}

renderFleet();

for (const field of [classFilter, gearboxFilter]) {
  field?.addEventListener('change', renderFleet);
}

function showError(message) {
  if (errorBox) errorBox.textContent = message;
  // Ошибка всегда про срок: остальные входы калькулятор задаёт сам.
  daysField?.setAttribute('aria-invalid', 'true');
  if (resultBox) resultBox.innerHTML = '';
}

function clearError() {
  if (errorBox) errorBox.textContent = '';
  daysField?.removeAttribute('aria-invalid');
}

function clearResult() {
  clearError();
  if (resultBox) resultBox.innerHTML = '';
  // Итога больше нет — значит нет и основания для заявки (решение R-01).
  estimate = null;
  refreshBooking();
}

function calculate() {
  if (!carField || !daysField) return;

  // Снимок живёт только вместе со свежим итогом: до успешного расчёта его нет.
  estimate = null;

  const carId = carField.value;
  const raw = daysField.value.trim();
  if (raw === '') {
    showError('Укажите срок аренды — целое число суток от 1 до 30.');
    refreshBooking();
    return;
  }
  const days = Number(raw);
  const extras = form
    ? [...form.querySelectorAll('input[name="extras"]:checked')].map((box) => box.value)
    : [];

  try {
    const result = calculateRental({ carId, days, extras });
    const car = cars.find((item) => item.id === carId);
    clearError();
    if (resultBox) resultBox.innerHTML = receiptHtml(result, { car, days });

    // Снимок расчёта — единственное основание заявки (контракт §4).
    estimate = { carId, days, extras, result };
    refreshBooking();
  } catch (error) {
    if (error instanceof RangeError) {
      showError(error.message);
      refreshBooking();
      return;
    }
    throw error;
  }
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
  });

  // Правка любого поля снимает устаревший итог: показываем только свежий расчёт.
  form.addEventListener('input', clearResult);

  // Выбор меняется и отсюда, поэтому id запоминаем в обоих местах.
  carField?.addEventListener('change', () => {
    chosenCarId = carField.value;
    markChosen(chosenCarId);
  });
}

if (list) {
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-calc-for]');
    if (!button) return;

    const car = cars.find((item) => item.id === button.dataset.calcFor);
    if (!car) return;

    chosenCarId = car.id;
    markChosen(chosenCarId);

    if (status) {
      status.textContent = `Выбрана ${car.model} — ${formatPrice(car.pricePerDay)} за сутки.`;
    }

    // Кнопка в карточке выбирает машину в калькуляторе и прокручивает к нему.
    if (carField) {
      carField.value = car.id;
      clearResult();
      document.getElementById('calculator')?.scrollIntoView({ block: 'start' });
      carField.focus();
    }
  });
}

// --- Заявка на бронирование ---

const bookingForm = document.getElementById('booking-form');
const bookingFieldsBox = document.querySelector('.booking__fields');
const bookingSnapshot = document.getElementById('booking-snapshot');
const bookingEmpty = document.getElementById('booking-empty');
const bookingEmptyText = document.getElementById('booking-empty-text');
const bookingEmptyLink = document.getElementById('booking-empty-link');
const bookingRequired = document.getElementById('booking-required');
const bookingMessage = document.getElementById('booking-message');
const bookingStatus = document.getElementById('booking-status');
const bookingResult = document.getElementById('booking-result');
const bookingSubmit = document.getElementById('booking-submit');

// Порядок полей — он же визуальный порядок и порядок обхода клавиатурой (FR-023).
const BOOKING_FIELD_ORDER = ['name', 'phone', 'startDate'];

const bookingFields = {
  name: document.getElementById('booking-name'),
  phone: document.getElementById('booking-phone'),
  startDate: document.getElementById('booking-date'),
};

const bookingErrors = {
  name: document.getElementById('booking-name-error'),
  phone: document.getElementById('booking-phone-error'),
  startDate: document.getElementById('booking-date-error'),
};

// UI ждёт ответ 10 секунд (контракт §10); дальше — состояние «сервер недоступен».
const SUBMIT_TIMEOUT_MS = 10_000;

// Снимок расчёта и состояние формы живут здесь: в DOM их держать нельзя — он перерисовывается.
let estimate = null;
let bookingState = BOOKING_STATES.NO_ESTIMATE;

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

// Все видимые строки ставятся один раз из BOOKING_TEXT: разметка их не дублирует.
function fillBookingText() {
  setText('booking-rail', BOOKING_TEXT.section.rail);
  setText('booking-heading', BOOKING_TEXT.section.heading);
  setText('booking-note', BOOKING_TEXT.section.note);

  for (const field of BOOKING_FIELD_ORDER) {
    const id = bookingFields[field]?.id;
    if (!id) continue;
    setText(`${id}-label`, BOOKING_TEXT.labels[field]);
    setText(`${id}-hint`, BOOKING_TEXT.hints[field]);
  }

  if (bookingEmptyText) bookingEmptyText.textContent = BOOKING_TEXT.noEstimate.text;
  if (bookingEmptyLink) bookingEmptyLink.textContent = BOOKING_TEXT.noEstimate.link;
  if (bookingRequired) bookingRequired.textContent = BOOKING_TEXT.required;
  if (bookingSubmit) bookingSubmit.textContent = BOOKING_TEXT.buttons.submit;
}

function receiptRow(list, label, value, modifier = '') {
  const row = document.createElement('div');
  row.className = `receipt__row${modifier}`;

  const term = document.createElement('dt');
  term.className = 'receipt__label';
  term.textContent = label;

  const value_ = document.createElement('dd');
  value_.className = 'receipt__value';
  value_.textContent = value;

  row.append(term, value_);
  list.append(row);
}

function renderSnapshot(snapshot) {
  if (!bookingSnapshot) return;
  bookingSnapshot.replaceChildren();
  if (!snapshot) return;

  const head = document.createElement('p');
  head.className = 'booking__head';
  head.textContent = BOOKING_TEXT.snapshot.heading;

  const list = document.createElement('dl');
  list.className = 'receipt';
  receiptRow(list, BOOKING_TEXT.snapshot.car, snapshot.carModel);
  receiptRow(list, BOOKING_TEXT.snapshot.days, snapshot.daysText);
  receiptRow(list, BOOKING_TEXT.snapshot.extras, snapshot.extrasText);
  receiptRow(list, BOOKING_TEXT.snapshot.total, snapshot.totalText, ' receipt__row--total');

  bookingSnapshot.append(head, list);
}

function renderConfirmation(confirmation) {
  if (!bookingResult) return;
  bookingResult.replaceChildren();
  if (!confirmation) return;

  const head = document.createElement('p');
  head.className = 'booking__head';
  head.textContent = BOOKING_TEXT.success.heading;

  const list = document.createElement('dl');
  list.className = 'receipt';
  receiptRow(list, BOOKING_TEXT.success.id, confirmation.id);
  receiptRow(list, BOOKING_TEXT.success.car, confirmation.carModel);
  receiptRow(list, BOOKING_TEXT.success.startDate, confirmation.startDateText);
  receiptRow(list, BOOKING_TEXT.success.days, confirmation.daysText);
  receiptRow(list, BOOKING_TEXT.success.total, confirmation.totalText, ' receipt__row--total');

  bookingResult.append(head, list);

  // Сумма из ответа разошлась с итогом снимка — показываем обе (FR-018).
  if (confirmation.correction) {
    const correction = document.createElement('p');
    correction.className = 'booking__correction';
    correction.textContent = confirmation.correction;
    bookingResult.append(correction);
  }

  const again = document.createElement('button');
  again.className = 'button';
  again.id = 'booking-again';
  again.type = 'button';
  again.textContent = BOOKING_TEXT.buttons.again;
  again.addEventListener('click', resetBooking);
  bookingResult.append(again);
}

// Ошибка поля: текст рядом с полем плюс aria-invalid на самом поле (контракт §7).
function setFieldError(field, text) {
  const control = bookingFields[field];
  const box = bookingErrors[field];

  if (box) box.textContent = text;
  if (!control) return;

  if (text) {
    control.setAttribute('aria-invalid', 'true');
  } else {
    control.removeAttribute('aria-invalid');
  }
}

// Единственный путь вывода формы: описание от чистых функций применяется к DOM как есть.
function applyState(view) {
  if (!bookingForm) return;

  bookingState = view.state;
  bookingForm.dataset.state = view.state;

  const look = statePresentation(view.state);

  // disabled, а не только серый вид: такие элементы выпадают и из обхода клавиатурой.
  for (const field of Object.values(bookingFields)) {
    if (field) field.disabled = look.locked || look.done;
  }
  if (bookingSubmit) {
    bookingSubmit.disabled = look.locked;
    bookingSubmit.hidden = look.done;
    bookingSubmit.textContent = look.buttonLabel;
  }

  const byField = new Map(view.fieldErrors.map((item) => [item.field, item.text]));
  for (const field of BOOKING_FIELD_ORDER) {
    setFieldError(field, byField.get(field) ?? '');
  }

  if (bookingMessage) bookingMessage.textContent = view.formMessage ?? '';
  if (bookingStatus) bookingStatus.textContent = view.statusMessage ?? '';

  const snapshot = snapshotView(estimate);
  renderSnapshot(snapshot);
  renderConfirmation(view.confirmation);

  if (bookingSnapshot) bookingSnapshot.hidden = snapshot === null || look.done;
  if (bookingEmpty) bookingEmpty.hidden = snapshot !== null || look.done;
  if (bookingFieldsBox) bookingFieldsBox.hidden = look.done;
  if (bookingRequired) bookingRequired.hidden = look.done;
}

// Состояние формы — производное от наличия снимка (инвариант решения R-01).
function refreshBooking() {
  if (!bookingForm) return;

  applyState({
    state: estimate ? BOOKING_STATES.EDITING : BOOKING_STATES.NO_ESTIMATE,
    fieldErrors: [],
    formMessage: null,
    statusMessage: null,
    confirmation: null,
  });
}

function readDraft() {
  return {
    name: bookingFields.name?.value ?? '',
    phone: bookingFields.phone?.value ?? '',
    startDate: bookingFields.startDate?.value ?? '',
  };
}

function focusFirstError(view) {
  const first = BOOKING_FIELD_ORDER.find((field) =>
    view.fieldErrors.some((item) => item.field === field),
  );

  bookingFields[first]?.focus();
}

// Отказ по снимку: расчёт устарел, основания для заявки больше нет (FR-043).
function applyOutcome(view) {
  if (statePresentation(view.state).dropsEstimate) estimate = null;
  applyState(view);
  focusFirstError(view);
}

function resetBooking() {
  for (const field of BOOKING_FIELD_ORDER) {
    if (bookingFields[field]) bookingFields[field].value = '';
    setFieldError(field, '');
  }

  // Сброс итога калькулятора обнуляет снимок и возвращает форму в «нет расчёта».
  clearResult();
}

// Единственное место, где UI обращается к сети. Исход нормализуется в один из четырёх
// видов, а решение по нему принимает responseView (контракт §7, решение R-05).
async function sendBooking(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      return { kind: 'unparsable' };
    }

    return { kind: 'json', status: response.status, body };
  } catch (error) {
    return { kind: error?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

if (bookingForm) {
  fillBookingText();

  // Границы поля даты — из общих функций, а не из разметки (контракт §2, решение R-06).
  if (bookingFields.startDate) {
    const today = todayUtc();
    bookingFields.startDate.min = today;
    bookingFields.startDate.max = addDays(today, BOOKING_HORIZON_DAYS);
  }

  // Правка поля снимает ошибку только этого поля (контракт §7).
  for (const field of BOOKING_FIELD_ORDER) {
    bookingFields[field]?.addEventListener('input', () => setFieldError(field, ''));
  }

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Повторная отправка во время отправки невозможна и без disabled.
    if (!estimate || bookingState === BOOKING_STATES.SUBMITTING) return;

    const draft = readDraft();
    const payload = bookingPayload(estimate, draft);

    const checked = checkDraft(payload, todayUtc());
    if (!checked.ok) {
      applyOutcome(checked);
      return;
    }

    const snapshotTotal = estimate.result.total;
    // Длина имени нужна чистым функциям, чтобы выбрать ветку текста name_length.
    const length = [...draft.name.trim()].length;

    applyState({
      state: BOOKING_STATES.SUBMITTING,
      fieldErrors: [],
      formMessage: null,
      statusMessage: BOOKING_TEXT.submitting,
      confirmation: null,
    });

    const outcome = await sendBooking(payload);
    applyOutcome(responseView(outcome, { snapshotTotal, length }));
  });

  refreshBooking();
}
