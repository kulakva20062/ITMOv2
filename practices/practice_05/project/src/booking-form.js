// Состояния формы заявки, сборка запроса и разбор ответа — чистыми функциями.
// Решения принимаются здесь, src/main.js только применяет результат к DOM.
// Источник имён полей, кодов, состояний и порядка разбора — specs/contracts/booking-contract.md.
// Проверка полей своя не пишется: вызывается validateBooking, которым проверяет и сервер (§3).
import { ERROR_CODES, addDays, validateBooking } from './booking.js';
import { BOOKING_STATES, BOOKING_TEXT, errorView } from './booking-text.js';
import { EXTRA_LABELS } from './calc.js';
import { cars } from './cars.js';
import { formatDate, formatPrice } from './format.js';

// Машиночитаемые имена состояний объявлены рядом с их подписями в src/booking-text.js;
// здесь они реэкспортируются как часть интерфейса формы.
export { BOOKING_STATES } from './booking-text.js';

function daysLabel(days) {
  return `${days} сут.`;
}

// Длина имени в кодовых точках — только чтобы выбрать ветку текста name_length (контракт §7).
// Само правило длины живёт в src/booking.js и здесь не повторяется.
function nameLength(value) {
  return [...String(value ?? '').trim()].length;
}

function view({
  state,
  fieldErrors = [],
  formMessage = null,
  statusMessage = null,
  confirmation = null,
}) {
  return { state, fieldErrors, formMessage, statusMessage, confirmation };
}

function unavailableView() {
  return view({
    state: BOOKING_STATES.UNAVAILABLE,
    statusMessage: BOOKING_TEXT.unavailable,
  });
}

function rejectedView() {
  return view({
    state: BOOKING_STATES.EDITING,
    formMessage: BOOKING_TEXT.rejected,
  });
}

// Как состояние отражается на форме: что заблокировать, что скрыть, что написать на кнопке.
// Решение живёт здесь, а не в связке с DOM: src/main.js только применяет готовые флаги.
export function statePresentation(state) {
  const locked =
    state === BOOKING_STATES.NO_ESTIMATE || state === BOOKING_STATES.SUBMITTING;

  return {
    // Поля недоступны, пока нет расчёта и пока идёт отправка.
    locked,
    // После успеха поля и кнопку заменяет подтверждение.
    done: state === BOOKING_STATES.SUCCESS,
    // «Нет расчёта» означает, что основания для заявки больше нет (FR-043).
    dropsEstimate: state === BOOKING_STATES.NO_ESTIMATE,
    buttonLabel:
      state === BOOKING_STATES.SUBMITTING
        ? BOOKING_TEXT.buttons.submitting
        : BOOKING_TEXT.buttons.submit,
    stateLabel: BOOKING_TEXT.states[state] ?? '',
  };
}

// Снимок расчёта для блока «только чтение». null, если расчёта ещё не было.
export function snapshotView(estimate) {
  if (!estimate) {
    return null;
  }

  const car = cars.find((item) => item.id === estimate.carId);
  const extras = Array.isArray(estimate.extras) ? estimate.extras : [];

  return {
    carModel: car?.model ?? String(estimate.carId ?? ''),
    daysText: daysLabel(estimate.days),
    extrasText: extras.length
      ? extras.map((option) => EXTRA_LABELS[option] ?? option).join(', ')
      : BOOKING_TEXT.snapshot.noExtras,
    totalText: formatPrice(estimate.result.total),
  };
}

// Тело запроса по контракту §4. Суммы, endDate и служебные поля не отправляются:
// цену считает сервер. Телефон уходит как введён — нормализует тоже сервер.
export function bookingPayload(estimate, draft) {
  return {
    carId: estimate.carId,
    days: estimate.days,
    extras: [...estimate.extras],
    name: draft.name,
    phone: draft.phone,
    startDate: draft.startDate,
  };
}

// Разбор списка ошибок полей в описание состояния. Приоритет решения R-04: если среди ошибок
// есть хоть одна по снимку (carId/days/extras), форма уходит в «нет расчёта» целиком —
// в этом состоянии поля недоступны, и исправлять ошибки рядом с ними посетитель не может.
function splitErrors(errors, context) {
  const fieldErrors = [];
  let stale = false;

  for (const entry of errors) {
    const single = errorView(entry.code, entry.field, context);

    if (single.state === BOOKING_STATES.NO_ESTIMATE) {
      stale = true;
      continue;
    }

    if (single.scope === 'field') {
      fieldErrors.push(single);
    }
  }

  if (stale) {
    return view({ state: BOOKING_STATES.NO_ESTIMATE, formMessage: BOOKING_TEXT.stale });
  }

  if (fieldErrors.length > 0) {
    return view({ state: BOOKING_STATES.EDITING, fieldErrors });
  }

  // Разбор ничего не дал: нераспознанные коды или пустой список.
  return rejectedView();
}

// Проверка черновика перед отправкой. Обёртка над validateBooking: своих правил не содержит.
export function checkDraft(payload, today) {
  const checked = validateBooking(payload, today);

  if (checked.ok) {
    return { ok: true, ...view({ state: BOOKING_STATES.EDITING }) };
  }

  return { ok: false, ...splitErrors(checked.errors, { length: nameLength(payload?.name) }) };
}

// Текст занятых дат. В API интервал полуоткрытый, посетителю называется последний занятый
// день — addDays(endDate, -1) (контракт §8). addDays и formatDate бросают RangeError на
// битом входе, поэтому любой непрочитанный conflict даёт формулировку без интервала.
export function conflictText(conflict) {
  try {
    const from = formatDate(conflict.startDate);
    const to = formatDate(addDays(conflict.endDate, -1));

    return errorView(ERROR_CODES.DATE_CONFLICT, 'startDate', { from, to }).text;
  } catch {
    return BOOKING_TEXT.conflictFallback;
  }
}

// Данные подтверждения из тела 201/200. Модель берётся из src/cars.js по carId, а не из
// текста ответа; телефон в подтверждении не показывается (контракт §5 и §12).
// null, если тело успеха прочитать не удалось.
export function confirmationView(booking, snapshotTotal = null) {
  const id = booking?.id;
  const total = booking?.price?.total;

  if (typeof id !== 'string' || !Number.isFinite(total)) {
    return null;
  }

  let startDateText = '';
  try {
    startDateText = formatDate(booking.startDate);
  } catch {
    startDateText = '';
  }

  const car = cars.find((item) => item.id === booking.carId);

  return {
    id,
    carModel: car?.model ?? String(booking.carId ?? ''),
    startDateText,
    daysText: daysLabel(booking.days),
    totalText: formatPrice(total),
    correction:
      Number.isFinite(snapshotTotal) && snapshotTotal !== total
        ? BOOKING_TEXT.success.correction(formatPrice(snapshotTotal), formatPrice(total))
        : null,
  };
}

// Исход обращения к серверу -> что показать. Порядок разбора — решение R-04 по каталогу §7.
// outcome: { kind: 'json', status, body } либо { kind: 'timeout' | 'network' | 'unparsable' }.
// options: { snapshotTotal, length } — итог снимка для сверки и длина имени для name_length.
// Исключений не бросает ни на одном входе, включая битые и чужие тела.
export function responseView(outcome, options = {}) {
  if (!outcome || outcome.kind !== 'json') {
    return unavailableView();
  }

  const status = Number(outcome.status);
  const body = outcome.body;

  if (status === 201 || status === 200) {
    const confirmation = confirmationView(body, options.snapshotTotal ?? null);

    // Успех, тело которого не читается, показывать как успех нечем.
    if (!confirmation) {
      return rejectedView();
    }

    return view({
      state: BOOKING_STATES.SUCCESS,
      statusMessage: BOOKING_TEXT.success.announce(confirmation.id),
      confirmation,
    });
  }

  if (!Number.isFinite(status) || status >= 500) {
    return unavailableView();
  }

  const error = body?.error;
  const code = typeof error?.code === 'string' ? error.code : null;

  if (code === 'internal_error') {
    return unavailableView();
  }

  if (status === 409) {
    return view({
      state: BOOKING_STATES.EDITING,
      fieldErrors: [
        {
          scope: 'field',
          field: 'startDate',
          state: BOOKING_STATES.EDITING,
          text: conflictText(error?.conflict),
        },
      ],
    });
  }

  if (status === 400 && code === 'validation_failed') {
    const fields = Array.isArray(error.fields) ? error.fields : [];

    return splitErrors(fields, { length: options.length });
  }

  return rejectedView();
}
