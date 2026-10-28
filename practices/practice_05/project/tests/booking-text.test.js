import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BOOKING_STATES, BOOKING_TEXT, errorView } from '../src/booking-text.js';
import { BOOKING_HORIZON_DAYS, ERROR_CODES } from '../src/booking.js';

test('BOOKING_TEXT заморожен вместе с вложенными объектами', () => {
  assert.ok(Object.isFrozen(BOOKING_TEXT));
  assert.ok(Object.isFrozen(BOOKING_TEXT.labels));
  assert.ok(Object.isFrozen(BOOKING_TEXT.buttons));
  assert.ok(Object.isFrozen(BOOKING_TEXT.success));
});

test('подписи и подсказки есть у всех трёх полей', () => {
  for (const field of ['name', 'phone', 'startDate']) {
    assert.ok(BOOKING_TEXT.labels[field], `нет подписи поля ${field}`);
    assert.ok(BOOKING_TEXT.hints[field], `нет подсказки поля ${field}`);
  }
});

test('подсказка телефона содержит заглушку из AGENTS.md', () => {
  assert.match(BOOKING_TEXT.hints.phone, /\+7 000 000-00-00/);
});

test('подписи кнопки есть для отправки, отправки в процессе и новой заявки', () => {
  for (const key of ['submit', 'submitting', 'again']) {
    assert.ok(BOOKING_TEXT.buttons[key], `нет подписи кнопки ${key}`);
  }
});

test('подписи состояний покрывают все пять имён BOOKING_STATES', () => {
  const slugs = Object.values(BOOKING_STATES);
  assert.equal(slugs.length, 5);

  for (const slug of slugs) {
    assert.ok(BOOKING_TEXT.states[slug], `нет подписи состояния ${slug}`);
  }
});

test('машиночитаемые имена состояний — ровно из контракта §7', () => {
  assert.deepEqual(Object.values(BOOKING_STATES), [
    'no-estimate',
    'editing',
    'submitting',
    'success',
    'unavailable',
  ]);
});

test('общие тексты формы непусты', () => {
  for (const key of ['stale', 'rejected', 'unavailable', 'conflictFallback', 'submitting']) {
    assert.ok(BOOKING_TEXT[key]?.length > 0, `пустой текст ${key}`);
  }
  assert.ok(BOOKING_TEXT.noEstimate.text.length > 0);
  assert.ok(BOOKING_TEXT.noEstimate.link.length > 0);
});

// --- Каталог контракта §7: код -> поле -> состояние -> текст ---

test('§7: required у каждого поля даёт свой текст', () => {
  const name = errorView(ERROR_CODES.REQUIRED, 'name');
  assert.deepEqual(name, {
    scope: 'field',
    field: 'name',
    state: BOOKING_STATES.EDITING,
    text: 'Укажите имя — так мы обратимся к вам при подтверждении.',
  });

  assert.equal(
    errorView(ERROR_CODES.REQUIRED, 'phone').text,
    'Укажите телефон — на него мы позвоним для подтверждения.',
  );

  assert.equal(
    errorView(ERROR_CODES.REQUIRED, 'startDate').text,
    'Выберите дату начала аренды.',
  );
});

test('§7: name_length выбирает ветку по длине значения', () => {
  assert.equal(
    errorView(ERROR_CODES.NAME_LENGTH, 'name', { length: 1 }).text,
    'Имя слишком короткое — не меньше 2 символов.',
  );

  assert.equal(
    errorView(ERROR_CODES.NAME_LENGTH, 'name', { length: 61 }).text,
    'Имя слишком длинное — не больше 60 символов.',
  );
});

test('§7: name_charset', () => {
  assert.equal(
    errorView(ERROR_CODES.NAME_CHARSET, 'name').text,
    'Имя — только буквы, пробел, дефис и апостроф.',
  );
});

test('§7: phone_charset и phone_invalid дают одну формулировку', () => {
  const charset = errorView(ERROR_CODES.PHONE_CHARSET, 'phone');
  const invalid = errorView(ERROR_CODES.PHONE_INVALID, 'phone');

  assert.equal(charset.text, 'Телефон должен содержать 11 цифр, например +7 000 000-00-00.');
  assert.equal(charset.text, invalid.text);
  assert.equal(charset.field, 'phone');
});

test('§7: три кода даты дают один текст «Выберите дату начала аренды.»', () => {
  for (const code of [ERROR_CODES.REQUIRED, ERROR_CODES.DATE_FORMAT, ERROR_CODES.DATE_INVALID]) {
    assert.equal(errorView(code, 'startDate').text, 'Выберите дату начала аренды.');
  }
});

test('§7: date_past', () => {
  assert.equal(
    errorView(ERROR_CODES.DATE_PAST, 'startDate').text,
    'Дата начала не может быть в прошлом — выберите сегодня или позже.',
  );
});

test('§7: date_too_far подставляет горизонт из BOOKING_HORIZON_DAYS, а не прошитое число', () => {
  const text = errorView(ERROR_CODES.DATE_TOO_FAR, 'startDate').text;

  assert.equal(text, `Дата начала не дальше ${BOOKING_HORIZON_DAYS} дней от сегодня.`);
  assert.match(text, /365/);

  // Горизонт можно переопределить контекстом — число не вмонтировано в строку.
  assert.match(errorView(ERROR_CODES.DATE_TOO_FAR, 'startDate', { horizon: 30 }).text, /30 дней/);
});

test('§7: date_conflict подставляет границы занятого интервала', () => {
  assert.equal(
    errorView(ERROR_CODES.DATE_CONFLICT, 'startDate', { from: '10.11.2026', to: '12.11.2026' })
      .text,
    'Эта машина занята с 10.11.2026 по 12.11.2026. ' +
      'Выберите другую дату начала или другую машину.',
  );
});

test('§7: отказ по carId, days и extras уводит в «нет расчёта» общим сообщением', () => {
  const cases = [
    [ERROR_CODES.REQUIRED, 'carId'],
    [ERROR_CODES.CAR_UNKNOWN, 'carId'],
    [ERROR_CODES.DAYS_NOT_INTEGER, 'days'],
    [ERROR_CODES.DAYS_OUT_OF_RANGE, 'days'],
    [ERROR_CODES.REQUIRED, 'days'],
    [ERROR_CODES.EXTRAS_NOT_ARRAY, 'extras'],
    [ERROR_CODES.EXTRA_UNKNOWN, 'extras'],
    [ERROR_CODES.EXTRAS_DUPLICATE, 'extras'],
  ];

  for (const [code, field] of cases) {
    assert.deepEqual(
      errorView(code, field),
      {
        scope: 'form',
        field: null,
        state: BOOKING_STATES.NO_ESTIMATE,
        text: 'Расчёт устарел — пересчитайте стоимость в калькуляторе.',
      },
      `${field}/${code} разобран не как устаревший снимок`,
    );
  }
});

test('§7: транспортные коды 4xx дают общее сообщение в состоянии заполнения', () => {
  const codes = [
    'invalid_json',
    'unsupported_media_type',
    'payload_too_large',
    'method_not_allowed',
    'not_found',
    'booking_not_found',
  ];

  for (const code of codes) {
    assert.deepEqual(errorView(code, null), {
      scope: 'form',
      field: null,
      state: BOOKING_STATES.EDITING,
      text: 'Заявка не принята. Проверьте поля и отправьте ещё раз.',
    });
  }
});

test('§7: internal_error уводит в «сервер недоступен»', () => {
  assert.deepEqual(errorView('internal_error', null), {
    scope: 'status',
    field: null,
    state: BOOKING_STATES.UNAVAILABLE,
    text: BOOKING_TEXT.unavailable,
  });
});

test('§7: нераспознанный код и нераспознанное поле дают общее сообщение без исключения', () => {
  const unknownCode = errorView('no_such_code', 'name');
  assert.equal(unknownCode.text, BOOKING_TEXT.rejected);
  assert.equal(unknownCode.state, BOOKING_STATES.EDITING);

  const unknownField = errorView(ERROR_CODES.REQUIRED, 'nickname');
  assert.equal(unknownField.text, BOOKING_TEXT.rejected);
  assert.equal(unknownField.field, null);

  // Отсутствующие аргументы — тоже ожидаемый вход, а не повод бросить исключение.
  assert.equal(errorView(undefined, undefined).text, BOOKING_TEXT.rejected);
  assert.equal(errorView(null, null, {}).text, BOOKING_TEXT.rejected);
});

test('текст ошибки никогда не берётся из message ответа сервера', () => {
  // Строка message сервера не должна совпадать ни с одной формулировкой UI:
  // UI рендерит по code (контракт §5 и §7, SC-011).
  const serverMessage = 'Имя — от 2 до 60 символов.';
  const uiText = errorView(ERROR_CODES.NAME_LENGTH, 'name', { length: 1 }).text;

  assert.notEqual(uiText, serverMessage);
});
