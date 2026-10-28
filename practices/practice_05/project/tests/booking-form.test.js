import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BOOKING_STATES,
  bookingPayload,
  checkDraft,
  confirmationView,
  conflictText,
  responseView,
  snapshotView,
  statePresentation,
} from '../src/booking-form.js';
import { BOOKING_TEXT } from '../src/booking-text.js';
import { calculateRental } from '../src/calc.js';
// Суммы сверяются через formatPrice, а не литералами: разделитель групп — NBSP.
import { formatPrice } from '../src/format.js';

const TODAY = '2026-11-01';

// Снимок расчёта строится тем же calculateRental, что и на странице, — суммы не выдумываются.
function estimateFor({ carId = 'larus-16', days = 3, extras = [] } = {}) {
  return { carId, days, extras, result: calculateRental({ carId, days, extras }) };
}

const DRAFT = { name: 'Иван Петров', phone: '+7 000 000-00-00', startDate: '2026-11-10' };

function bookingBody(overrides = {}) {
  return {
    id: 'AD-0001',
    status: 'confirmed',
    carId: 'larus-16',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
    days: 3,
    extras: [],
    customer: { name: 'Иван Петров', phone: '+70000000000' },
    price: { base: 7200, discount: 0, extrasTotal: 0, insurance: 0, total: 7200, deposit: 10000 },
    createdAt: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}

const json = (status, body) => ({ kind: 'json', status, body });

// --- Состояния и снимок ---

test('машиночитаемые имена состояний реэкспортированы из модуля формы', () => {
  assert.deepEqual(Object.values(BOOKING_STATES), [
    'no-estimate',
    'editing',
    'submitting',
    'success',
    'unavailable',
  ]);
});

test('поля заблокированы без расчёта и во время отправки, свободны в остальных состояниях', () => {
  assert.equal(statePresentation(BOOKING_STATES.NO_ESTIMATE).locked, true);
  assert.equal(statePresentation(BOOKING_STATES.SUBMITTING).locked, true);
  assert.equal(statePresentation(BOOKING_STATES.EDITING).locked, false);
  assert.equal(statePresentation(BOOKING_STATES.UNAVAILABLE).locked, false);
});

test('после успеха поля и кнопку заменяет подтверждение', () => {
  assert.equal(statePresentation(BOOKING_STATES.SUCCESS).done, true);

  for (const state of ['no-estimate', 'editing', 'submitting', 'unavailable']) {
    assert.equal(statePresentation(state).done, false, state);
  }
});

test('снимок расчёта сбрасывается только состоянием «нет расчёта»', () => {
  assert.equal(statePresentation(BOOKING_STATES.NO_ESTIMATE).dropsEstimate, true);

  for (const state of ['editing', 'submitting', 'success', 'unavailable']) {
    assert.equal(statePresentation(state).dropsEstimate, false, state);
  }
});

test('подпись кнопки меняется только на время отправки', () => {
  assert.equal(
    statePresentation(BOOKING_STATES.SUBMITTING).buttonLabel,
    BOOKING_TEXT.buttons.submitting,
  );

  for (const state of ['no-estimate', 'editing', 'success', 'unavailable']) {
    assert.equal(statePresentation(state).buttonLabel, BOOKING_TEXT.buttons.submit, state);
  }
});

test('у каждого состояния есть русская подпись из каталога §7', () => {
  for (const state of Object.values(BOOKING_STATES)) {
    assert.equal(statePresentation(state).stateLabel, BOOKING_TEXT.states[state]);
    assert.ok(statePresentation(state).stateLabel.length > 0, state);
  }

  // Чужое состояние не роняет форму.
  assert.equal(statePresentation('нет такого').stateLabel, '');
});

test('snapshotView без расчёта отдаёт null', () => {
  assert.equal(snapshotView(null), null);
  assert.equal(snapshotView(undefined), null);
});

test('snapshotView показывает машину, срок, опции и итог', () => {
  const view = snapshotView(estimateFor({ days: 3, extras: ['child-seat'] }));

  assert.equal(view.carModel, 'Ларус 1.6');
  assert.equal(view.daysText, '3 сут.');
  assert.match(view.extrasText, /кресло/i);
  assert.match(view.totalText, /₽$/);
});

test('snapshotView без опций пишет «без опций»', () => {
  assert.equal(snapshotView(estimateFor()).extrasText, BOOKING_TEXT.snapshot.noExtras);
});

test('snapshotView выводит итог через formatPrice', () => {
  const estimate = estimateFor({ carId: 'prima-sedan', days: 2 });

  // 7200 * 2 = 14 400, формат с неразрывной группировкой тысяч.
  assert.equal(estimate.result.total, 14400);
  assert.equal(snapshotView(estimate).totalText, formatPrice(14400));
});

// --- Тело запроса (контракт §4) ---

test('bookingPayload содержит ровно шесть полей контракта §4', () => {
  const payload = bookingPayload(estimateFor(), DRAFT);

  assert.deepEqual(Object.keys(payload).sort(), [
    'carId',
    'days',
    'extras',
    'name',
    'phone',
    'startDate',
  ]);
});

test('bookingPayload не отправляет сумм, endDate и служебных полей', () => {
  const payload = bookingPayload(estimateFor({ extras: ['full-insurance'] }), DRAFT);

  for (const forbidden of ['price', 'total', 'base', 'deposit', 'endDate', 'id', 'status', 'createdAt']) {
    assert.ok(!(forbidden in payload), `в запрос попало поле ${forbidden}`);
  }
});

test('bookingPayload отдаёт days числом, а extras — массивом', () => {
  const payload = bookingPayload(estimateFor({ days: 7, extras: [] }), DRAFT);

  assert.equal(typeof payload.days, 'number');
  assert.equal(payload.days, 7);
  assert.ok(Array.isArray(payload.extras));
  assert.deepEqual(payload.extras, []);
});

test('bookingPayload передаёт телефон как ввёл посетитель, без нормализации', () => {
  const payload = bookingPayload(estimateFor(), { ...DRAFT, phone: '8 (000) 000-00-00' });

  assert.equal(payload.phone, '8 (000) 000-00-00');
});

// --- checkDraft: проверка тем же предикатом, что и на сервере ---

test('checkDraft на корректном черновике разрешает отправку', () => {
  const result = checkDraft(bookingPayload(estimateFor(), DRAFT), TODAY);

  assert.deepEqual(result, {
    ok: true,
    state: BOOKING_STATES.EDITING,
    fieldErrors: [],
    formMessage: null,
    statusMessage: null,
    confirmation: null,
  });
});

test('checkDraft собирает ошибки всех полей за один проход', () => {
  const payload = bookingPayload(estimateFor(), { name: '', phone: '', startDate: '' });
  const result = checkDraft(payload, TODAY);

  assert.equal(result.ok, false);
  assert.equal(result.state, BOOKING_STATES.EDITING);
  assert.deepEqual(
    result.fieldErrors.map((item) => item.field),
    ['name', 'phone', 'startDate'],
  );
});

test('checkDraft выбирает короткую ветку name_length по значению поля', () => {
  const payload = bookingPayload(estimateFor(), { ...DRAFT, name: 'И' });
  const [error] = checkDraft(payload, TODAY).fieldErrors;

  assert.equal(error.field, 'name');
  assert.match(error.text, /слишком короткое/);
});

test('checkDraft выбирает длинную ветку name_length по значению поля', () => {
  const payload = bookingPayload(estimateFor(), { ...DRAFT, name: 'Иван'.repeat(20) });
  const [error] = checkDraft(payload, TODAY).fieldErrors;

  assert.match(error.text, /слишком длинное/);
});

test('checkDraft отличает недопустимые символы имени от длины', () => {
  const payload = bookingPayload(estimateFor(), { ...DRAFT, name: 'Иван123' });
  const [error] = checkDraft(payload, TODAY).fieldErrors;

  assert.match(error.text, /только буквы, пробел, дефис и апостроф/);
});

test('checkDraft ловит дату в прошлом и дату за горизонтом', () => {
  const past = checkDraft(
    bookingPayload(estimateFor(), { ...DRAFT, startDate: '2026-10-31' }),
    TODAY,
  );
  assert.match(past.fieldErrors[0].text, /не может быть в прошлом/);

  const far = checkDraft(
    bookingPayload(estimateFor(), { ...DRAFT, startDate: '2028-01-01' }),
    TODAY,
  );
  assert.match(far.fieldErrors[0].text, /не дальше 365 дней/);
});

test('checkDraft при устаревшем снимке уводит в «нет расчёта» без ошибок полей', () => {
  const payload = bookingPayload({ carId: 'no-such-car', days: 3, extras: [] }, DRAFT);
  const result = checkDraft(payload, TODAY);

  assert.equal(result.state, BOOKING_STATES.NO_ESTIMATE);
  assert.equal(result.formMessage, BOOKING_TEXT.stale);
  assert.deepEqual(result.fieldErrors, []);
});

test('устаревший снимок побеждает ошибки полей: исправлять их всё равно негде', () => {
  const payload = bookingPayload({ carId: 'no-such-car', days: 99, extras: [] }, { name: '', phone: '', startDate: '' });
  const result = checkDraft(payload, TODAY);

  assert.equal(result.state, BOOKING_STATES.NO_ESTIMATE);
  assert.deepEqual(result.fieldErrors, []);
});

// --- conflictText: полуоткрытый интервал -> последний занятый день (контракт §8) ---

test('conflictText называет последний занятый день, а не дату возврата', () => {
  const text = conflictText({ carId: 'larus-16', startDate: '2026-11-10', endDate: '2026-11-13' });

  assert.equal(
    text,
    'Эта машина занята с 10.11.2026 по 12.11.2026. ' +
      'Выберите другую дату начала или другую машину.',
  );
  // День возврата 13.11 свободен и в тексте не упоминается.
  assert.ok(!text.includes('13.11.2026'));
});

test('conflictText откатывается на формулировку без интервала, если conflict не прочитан', () => {
  const broken = [
    null,
    undefined,
    {},
    { startDate: '2026-11-10' },
    { startDate: 'вчера', endDate: 'завтра' },
    { startDate: '2026-11-10', endDate: '10.11.2026' },
    { startDate: 2026, endDate: 2027 },
  ];

  for (const conflict of broken) {
    assert.equal(
      conflictText(conflict),
      BOOKING_TEXT.conflictFallback,
      `не сработал откат для ${JSON.stringify(conflict)}`,
    );
  }
});

// --- confirmationView ---

test('confirmationView берёт номер, модель, дату, срок и итог из ответа', () => {
  const view = confirmationView(bookingBody());

  assert.equal(view.id, 'AD-0001');
  assert.equal(view.carModel, 'Ларус 1.6');
  assert.equal(view.startDateText, '10.11.2026');
  assert.equal(view.daysText, '3 сут.');
  assert.equal(view.totalText, formatPrice(7200));
});

test('confirmationView не содержит телефона посетителя', () => {
  const view = confirmationView(bookingBody());

  assert.ok(!JSON.stringify(view).includes('70000000000'));
  assert.ok(!('phone' in view));
  assert.ok(!('customer' in view));
});

test('confirmationView берёт модель из src/cars.js, а не из текста ответа', () => {
  const view = confirmationView(bookingBody({ carId: 'prima-long' }));

  assert.equal(view.carModel, 'Прима Лонг');
});

test('совпадающий итог не даёт строки об уточнении', () => {
  assert.equal(confirmationView(bookingBody(), 7200).correction, null);
});

test('расхождение итога даёт строку с обеими суммами', () => {
  const view = confirmationView(bookingBody(), 7000);

  assert.ok(view.correction.includes(formatPrice(7000)), 'нет прежней суммы');
  assert.ok(view.correction.includes(formatPrice(7200)), 'нет уточнённой суммы');
});

test('confirmationView отдаёт null на нечитаемом теле успеха', () => {
  assert.equal(confirmationView(null), null);
  assert.equal(confirmationView({}), null);
  assert.equal(confirmationView({ id: 'AD-0001' }), null);
  assert.equal(confirmationView({ id: 42, price: { total: 100 } }), null);
});

test('confirmationView не падает на битой дате в теле ответа', () => {
  const view = confirmationView(bookingBody({ startDate: 'не дата' }));

  assert.equal(view.id, 'AD-0001');
  assert.equal(view.startDateText, '');
});

// --- responseView: каталог §7 целиком ---

test('§7: 201 — успех с подтверждением', () => {
  const view = responseView(json(201, bookingBody()));

  assert.equal(view.state, BOOKING_STATES.SUCCESS);
  assert.equal(view.confirmation.id, 'AD-0001');
  assert.deepEqual(view.fieldErrors, []);
  assert.match(view.statusMessage, /AD-0001/);
});

test('§7: 200 и 201 обрабатываются одинаково (FR-044)', () => {
  const created = responseView(json(201, bookingBody()));
  const repeated = responseView(json(200, bookingBody()));

  assert.deepEqual(repeated, created);
});

test('§7: 409 — ошибка у поля даты с занятым интервалом', () => {
  const view = responseView(
    json(409, {
      error: {
        code: 'date_conflict',
        message: 'серверная формулировка, которую UI не показывает',
        fields: [{ field: 'startDate', code: 'date_conflict', message: 'Занято…' }],
        conflict: { carId: 'larus-16', startDate: '2026-11-10', endDate: '2026-11-13' },
      },
    }),
  );

  assert.equal(view.state, BOOKING_STATES.EDITING);
  assert.equal(view.fieldErrors.length, 1);
  assert.equal(view.fieldErrors[0].field, 'startDate');
  assert.match(view.fieldErrors[0].text, /с 10\.11\.2026 по 12\.11\.2026/);
});

test('§7: 409 без conflict — формулировка без интервала', () => {
  const view = responseView(json(409, { error: { code: 'date_conflict', fields: [] } }));

  assert.equal(view.fieldErrors[0].text, BOOKING_TEXT.conflictFallback);
});

test('§7: 400 validation_failed с полями ввода — ошибки у полей', () => {
  const view = responseView(
    json(400, {
      error: {
        code: 'validation_failed',
        message: 'Проверьте поля заявки: 2 поля заполнены неверно.',
        fields: [
          { field: 'name', code: 'name_charset', message: 'серверный текст' },
          { field: 'phone', code: 'phone_invalid', message: 'серверный текст' },
        ],
      },
    }),
  );

  assert.equal(view.state, BOOKING_STATES.EDITING);
  assert.deepEqual(
    view.fieldErrors.map((item) => item.field),
    ['name', 'phone'],
  );
  assert.match(view.fieldErrors[0].text, /только буквы/);
});

test('§7: 400 по снимку расчёта — «нет расчёта» общим сообщением', () => {
  const view = responseView(
    json(400, {
      error: {
        code: 'validation_failed',
        fields: [{ field: 'days', code: 'days_out_of_range', message: 'серверный текст' }],
      },
    }),
  );

  assert.equal(view.state, BOOKING_STATES.NO_ESTIMATE);
  assert.equal(view.formMessage, BOOKING_TEXT.stale);
  assert.deepEqual(view.fieldErrors, []);
});

test('§7: смешанный 400 — снимок важнее ошибок полей (решение R-04)', () => {
  const view = responseView(
    json(400, {
      error: {
        code: 'validation_failed',
        fields: [
          { field: 'carId', code: 'car_unknown' },
          { field: 'name', code: 'name_charset' },
        ],
      },
    }),
  );

  assert.equal(view.state, BOOKING_STATES.NO_ESTIMATE);
  assert.deepEqual(view.fieldErrors, []);
});

test('§7: транспортные отказы 4xx — общее сообщение, состояние заполнения', () => {
  const cases = [
    [400, 'invalid_json'],
    [415, 'unsupported_media_type'],
    [413, 'payload_too_large'],
    [405, 'method_not_allowed'],
    [404, 'not_found'],
    [404, 'booking_not_found'],
  ];

  for (const [status, code] of cases) {
    const view = responseView(json(status, { error: { code, message: 'серверный текст', fields: [] } }));

    assert.equal(view.state, BOOKING_STATES.EDITING, `${status} ${code}`);
    assert.equal(view.formMessage, BOOKING_TEXT.rejected, `${status} ${code}`);
    assert.deepEqual(view.fieldErrors, []);
  }
});

test('§7: 5xx, таймаут, разрыв связи и неразобранный ответ — «сервер недоступен»', () => {
  const outcomes = [
    json(500, { error: { code: 'internal_error', message: 'Внутренняя ошибка сервера.' } }),
    json(503, null),
    { kind: 'timeout' },
    { kind: 'network' },
    { kind: 'unparsable' },
  ];

  for (const outcome of outcomes) {
    const view = responseView(outcome);

    assert.equal(view.state, BOOKING_STATES.UNAVAILABLE, JSON.stringify(outcome));
    assert.equal(view.statusMessage, BOOKING_TEXT.unavailable);
    assert.deepEqual(view.fieldErrors, []);
  }
});

test('§7: нераспознанный код даёт общее сообщение', () => {
  const view = responseView(json(422, { error: { code: 'teapot', fields: [] } }));

  assert.equal(view.state, BOOKING_STATES.EDITING);
  assert.equal(view.formMessage, BOOKING_TEXT.rejected);
});

test('§7: нераспознанное имя поля не показывается как ошибка поля', () => {
  const view = responseView(
    json(400, {
      error: { code: 'validation_failed', fields: [{ field: 'nickname', code: 'required' }] },
    }),
  );

  assert.equal(view.state, BOOKING_STATES.EDITING);
  assert.equal(view.formMessage, BOOKING_TEXT.rejected);
  assert.deepEqual(view.fieldErrors, []);
});

test('responseView не бросает исключений на битых и чужих телах', () => {
  const broken = [
    undefined,
    null,
    {},
    { kind: 'json' },
    json(200, null),
    json(201, { id: 'AD-0001' }),
    json(400, {}),
    json(400, { error: null }),
    json(400, { error: { code: 'validation_failed' } }),
    json(400, { error: { code: 'validation_failed', fields: 'не массив' } }),
    json(400, { error: { code: 'validation_failed', fields: [] } }),
    json(409, {}),
    json(409, { error: { conflict: 'строка вместо объекта' } }),
    json('двести', bookingBody()),
    json(204, undefined),
  ];

  for (const outcome of broken) {
    assert.doesNotThrow(() => responseView(outcome), JSON.stringify(outcome) ?? 'undefined');

    const view = responseView(outcome);
    assert.ok(Object.values(BOOKING_STATES).includes(view.state), `чужое состояние: ${view.state}`);
  }
});

test('responseView никогда не показывает message из ответа сервера (SC-011)', () => {
  const serverMessage = 'СЕРВЕРНАЯ-ФОРМУЛИРОВКА-МАРКЕР';
  const outcomes = [
    json(400, {
      error: {
        code: 'validation_failed',
        message: serverMessage,
        fields: [{ field: 'name', code: 'name_charset', message: serverMessage }],
      },
    }),
    json(409, {
      error: {
        code: 'date_conflict',
        message: serverMessage,
        fields: [{ field: 'startDate', code: 'date_conflict', message: serverMessage }],
        conflict: { carId: 'larus-16', startDate: '2026-11-10', endDate: '2026-11-13' },
      },
    }),
    json(500, { error: { code: 'internal_error', message: serverMessage } }),
    json(415, { error: { code: 'unsupported_media_type', message: serverMessage } }),
  ];

  for (const outcome of outcomes) {
    assert.ok(
      !JSON.stringify(responseView(outcome)).includes(serverMessage),
      `формулировка сервера утекла в UI: ${JSON.stringify(outcome)}`,
    );
  }
});
