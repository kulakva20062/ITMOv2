import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKING_HORIZON_DAYS,
  ERROR_CODES,
  addDays,
  isCalendarDate,
  isValidName,
  normalizePhone,
  overlaps,
  todayUtc,
  validateBooking,
} from '../src/booking.js';

// Фиксированные часы: таблицы граничных значений спеки привязаны к этой дате.
const TODAY = '2026-10-23';

const VALID = Object.freeze({
  carId: 'larus-16',
  days: 3,
  extras: [],
  name: 'Иван Петров',
  phone: '+7 000 000-00-00',
  startDate: '2026-11-10',
});

function check(overrides = {}) {
  return validateBooking({ ...VALID, ...overrides }, TODAY);
}

// Код ошибки по полю или null, если поле прошло проверку.
function codeFor(result, field) {
  return result.errors.find((item) => item.field === field)?.code ?? null;
}

test('BOOKING_HORIZON_DAYS — 365 суток', () => {
  assert.equal(BOOKING_HORIZON_DAYS, 365);
});

test('ERROR_CODES заморожен и содержит ровно 16 кодов полей', () => {
  assert.ok(Object.isFrozen(ERROR_CODES));
  assert.equal(Object.keys(ERROR_CODES).length, 16);

  const codes = Object.values(ERROR_CODES);
  assert.equal(new Set(codes).size, 16, 'коды не повторяются');
  assert.deepEqual(
    [...codes].sort(),
    [
      'car_unknown',
      'date_conflict',
      'date_format',
      'date_invalid',
      'date_past',
      'date_too_far',
      'days_not_integer',
      'days_out_of_range',
      'extra_unknown',
      'extras_duplicate',
      'extras_not_array',
      'name_charset',
      'name_length',
      'phone_charset',
      'phone_invalid',
      'required',
    ],
    'набор кодов совпадает с каталогом контракта §7',
  );
});

test('todayUtc отдаёт дату UTC в виде ГГГГ-ММ-ДД', () => {
  const today = todayUtc();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(today, new Date().toISOString().slice(0, 10));
});

test('addDays переносит срок через конец года', () => {
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
});

test('addDays учитывает високосный февраль', () => {
  assert.equal(addDays('2028-02-28', 2), '2028-03-01');
  assert.equal(addDays('2026-02-28', 2), '2026-03-02');
});

test('addDays работает с нулевым и отрицательным сдвигом', () => {
  assert.equal(addDays('2026-11-10', 0), '2026-11-10');
  assert.equal(addDays('2026-11-13', -1), '2026-11-12');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
});

test('addDays доходит до горизонта бронирования', () => {
  assert.equal(addDays('2026-10-23', BOOKING_HORIZON_DAYS), '2027-10-23');
});

test('addDays требует существующую дату и целый сдвиг', () => {
  assert.throws(() => addDays('2026-02-30', 1), RangeError);
  assert.throws(() => addDays('2026-2-3', 1), RangeError);
  assert.throws(() => addDays('23.10.2026', 1), RangeError);
  assert.throws(() => addDays(undefined, 1), RangeError);
  assert.throws(() => addDays('2026-11-10', 1.5), RangeError);
});

test('isValidName принимает имена по границам длины', () => {
  assert.equal(isValidName('Ия'), true, 'нижняя граница — 2 символа');
  assert.equal(isValidName('И'), false, 'один символ — коротко');
  assert.equal(isValidName('я'.repeat(60)), true, 'верхняя граница — 60 символов');
  assert.equal(isValidName('я'.repeat(61)), false, '61 символ — длинно');
});

test('isValidName принимает дефис, апостроф и латиницу', () => {
  assert.equal(isValidName("Анна-Мария О'Коннор"), true);
  assert.equal(isValidName('Ivan Petrov'), true);
  assert.equal(isValidName('  Иван  '), true, 'края обрезаются до проверки');
});

test('isValidName отсекает пустое и посторонние символы', () => {
  assert.equal(isValidName(''), false);
  assert.equal(isValidName('   '), false);
  assert.equal(isValidName('Иван 2'), false);
  assert.equal(isValidName('ivan@mail'), false);
  assert.equal(isValidName('--'), false, 'хотя бы одна буква обязательна');
  assert.equal(isValidName('Иван 🙂'), false);
  assert.equal(isValidName(undefined), false);
  assert.equal(isValidName(null), false);
  assert.equal(isValidName(42), false);
});

test('normalizePhone приводит разные записи к +7XXXXXXXXXX', () => {
  assert.equal(normalizePhone('+7 000 000-00-00'), '+70000000000');
  assert.equal(normalizePhone('80000000000'), '+70000000000');
  assert.equal(normalizePhone('+7 (000) 000-00-00'), '+70000000000');
  assert.equal(normalizePhone('  +7 000 000-00-00  '), '+70000000000');
});

test('normalizePhone отклоняет неверное число цифр и чужой код страны', () => {
  assert.equal(normalizePhone('0000000000'), null, '10 цифр');
  assert.equal(normalizePhone('700000000000'), null, '12 цифр');
  assert.equal(normalizePhone('+10000000000'), null, 'не код 7 и не 8');
  assert.equal(normalizePhone('123'), null);
});

test('normalizePhone отклоняет посторонние символы', () => {
  assert.equal(normalizePhone('телефон'), null);
  assert.equal(normalizePhone('+7-000-000-00-0a'), null);
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(undefined), null);
  assert.equal(normalizePhone(null), null);
});

test('validateBooking принимает корректную заявку и нормализует поля', () => {
  const result = check();

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value, {
    carId: 'larus-16',
    days: 3,
    extras: [],
    name: 'Иван Петров',
    phone: '+70000000000',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
  });
});

test('validateBooking обрезает имя и приводит телефон к нормальному виду', () => {
  const result = check({ name: '  Иван  ', phone: '80000000000' });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, 'Иван');
  assert.equal(result.value.phone, '+70000000000');
});

test('validateBooking канонизирует порядок опций', () => {
  const result = check({ extras: ['full-insurance', 'child-seat'] });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.extras, ['child-seat', 'full-insurance']);
});

test('validateBooking требует сегодняшнюю дату параметром', () => {
  assert.throws(() => validateBooking(VALID, undefined), RangeError);
  assert.throws(() => validateBooking(VALID, '23.10.2026'), RangeError);
});

test('validateBooking: граничные значения срока аренды', () => {
  assert.equal(check({ days: 0 }).errors[0].code, 'days_out_of_range');
  assert.equal(check({ days: 1 }).ok, true, 'нижняя граница');
  assert.equal(check({ days: 6 }).ok, true);
  assert.equal(check({ days: 7 }).ok, true);
  assert.equal(check({ days: 13 }).ok, true);
  assert.equal(check({ days: 14 }).ok, true);
  assert.equal(check({ days: 30 }).ok, true, 'верхняя граница');
  assert.equal(check({ days: 31 }).errors[0].code, 'days_out_of_range');
  assert.equal(check({ days: 1.5 }).errors[0].code, 'days_not_integer');
  assert.equal(check({ days: '3' }).errors[0].code, 'days_not_integer', 'строка не число');
  assert.equal(check({ days: Number.NaN }).errors[0].code, 'days_not_integer');
  assert.equal(check({ days: null }).errors[0].code, 'required');
  assert.equal(codeFor(validateBooking({ ...VALID, days: undefined }, TODAY), 'days'), 'required');
});

test('validateBooking: граничные значения даты начала', () => {
  assert.equal(codeFor(check({ startDate: '2026-10-22' }), 'startDate'), 'date_past');
  assert.equal(check({ startDate: '2026-10-23' }).ok, true, 'аренда с сегодня');
  assert.equal(check({ startDate: '2027-10-23' }).ok, true, 'верхняя граница горизонта');
  assert.equal(codeFor(check({ startDate: '2027-10-24' }), 'startDate'), 'date_too_far');
  assert.equal(codeFor(check({ startDate: '2026-2-3' }), 'startDate'), 'date_format');
  assert.equal(codeFor(check({ startDate: '23.10.2026' }), 'startDate'), 'date_format');
  assert.equal(
    codeFor(check({ startDate: '2026-10-23T00:00:00Z' }), 'startDate'),
    'date_format',
  );
  assert.equal(codeFor(check({ startDate: '2026-02-30' }), 'startDate'), 'date_invalid');
  assert.equal(codeFor(check({ startDate: '2026-13-01' }), 'startDate'), 'date_invalid');
  assert.equal(codeFor(check({ startDate: null }), 'startDate'), 'required');
  assert.equal(codeFor(check({ startDate: '' }), 'startDate'), 'required');
});

test('validateBooking: граничные значения опций', () => {
  assert.deepEqual(validateBooking({ ...VALID, extras: undefined }, TODAY).value.extras, []);
  assert.equal(check({ extras: [] }).ok, true);
  assert.equal(check({ extras: ['child-seat', 'extra-driver', 'full-insurance'] }).ok, true);
  assert.equal(codeFor(check({ extras: ['child-seat', 'child-seat'] }), 'extras'), 'extras_duplicate');
  assert.equal(codeFor(check({ extras: ['gps'] }), 'extras'), 'extra_unknown');
  assert.equal(codeFor(check({ extras: 'child-seat' }), 'extras'), 'extras_not_array');
  assert.equal(codeFor(check({ extras: {} }), 'extras'), 'extras_not_array');
  assert.equal(codeFor(check({ extras: null }), 'extras'), 'extras_not_array');
});

test('validateBooking: неизвестная машина', () => {
  const result = check({ carId: 'ferrari-f40' });

  assert.equal(codeFor(result, 'carId'), 'car_unknown');
  assert.match(result.errors[0].message, /ferrari-f40/, 'текст называет полученное значение');
  assert.equal(codeFor(check({ carId: '' }), 'carId'), 'required');
});

test('validateBooking: границы имени и телефона', () => {
  assert.equal(codeFor(check({ name: 'И' }), 'name'), 'name_length');
  assert.equal(codeFor(check({ name: 'я'.repeat(61) }), 'name'), 'name_length');
  assert.equal(codeFor(check({ name: 'Иван 2' }), 'name'), 'name_charset');
  assert.equal(codeFor(check({ name: '   ' }), 'name'), 'required');
  assert.equal(codeFor(check({ phone: '0000000000' }), 'phone'), 'phone_invalid');
  assert.equal(codeFor(check({ phone: 'телефон' }), 'phone'), 'phone_charset');
  assert.equal(codeFor(check({ phone: '' }), 'phone'), 'required');
});

test('validateBooking собирает ошибки по всем полям в стабильном порядке', () => {
  const result = check({ days: 0, name: 'A', phone: '123' });

  assert.equal(result.ok, false);
  assert.equal(result.value, null);
  assert.deepEqual(
    result.errors.map((item) => item.field),
    ['days', 'name', 'phone'],
  );
  assert.deepEqual(
    result.errors.map((item) => item.code),
    ['days_out_of_range', 'name_length', 'phone_invalid'],
  );
});

test('validateBooking: порядок полей — carId, days, extras, name, phone, startDate', () => {
  const result = validateBooking(
    { carId: 'нет', days: 0, extras: ['gps'], name: 'A', phone: '123', startDate: '2026-02-30' },
    TODAY,
  );

  assert.deepEqual(
    result.errors.map((item) => item.field),
    ['carId', 'days', 'extras', 'name', 'phone', 'startDate'],
  );
});

test('validateBooking даёт не больше одной записи на поле', () => {
  const result = validateBooking({}, TODAY);
  const fields = result.errors.map((item) => item.field);

  assert.equal(new Set(fields).size, fields.length);
});

test('у каждой ошибки есть поле, код из каталога и непустой текст', () => {
  const result = check({ days: 0, name: 'A', phone: '123' });
  const known = new Set(Object.values(ERROR_CODES));

  for (const item of result.errors) {
    assert.ok(known.has(item.code), `код ${item.code} есть в каталоге`);
    assert.equal(typeof item.message, 'string');
    assert.ok(item.message.length > 0);
  }
});

test('тексты ошибок называют границы из src/calc.js, а не свои числа', () => {
  assert.match(check({ days: 0 }).errors[0].message, /от 1 до 30/);
  assert.match(check({ days: 0 }).errors[0].message, /Получено: 0/);
  assert.match(check({ name: 'И' }).errors[0].message, /от 2 до 60/);
  assert.match(check({ phone: '123' }).errors[0].message, /Получено цифр: 3/);
  assert.match(
    check({ startDate: '2027-10-24' }).errors[0].message,
    new RegExp(String(BOOKING_HORIZON_DAYS)),
  );
});

test('validateBooking достигает всех 15 кодов проверки полей', () => {
  // Шестнадцатый код каталога — date_conflict: он зависит от состояния хранилища
  // и проверяется сквозными тестами сервера, а не чистой функцией.
  const cases = [
    {},
    { carId: 'нет' },
    { days: '3' },
    { days: 31 },
    { extras: 'child-seat' },
    { extras: ['gps'] },
    { extras: ['child-seat', 'child-seat'] },
    { name: 'И' },
    { name: 'Иван 2' },
    { phone: 'телефон' },
    { phone: '0000000000' },
    { startDate: '23.10.2026' },
    { startDate: '2026-02-30' },
    { startDate: '2026-10-22' },
    { startDate: '2027-10-24' },
  ];

  const seen = new Set();
  for (const overrides of cases) {
    for (const item of validateBooking({ ...VALID, ...overrides }, TODAY).errors) {
      seen.add(item.code);
    }
  }

  // Пустое тело даёт required по каждому обязательному полю.
  for (const item of validateBooking({}, TODAY).errors) {
    seen.add(item.code);
  }

  const expected = Object.values(ERROR_CODES).filter((code) => code !== ERROR_CODES.DATE_CONFLICT);
  assert.deepEqual([...seen].sort(), [...expected].sort());
});

// Занято 10, 11 и 12 ноября: интервал полуоткрытый, 13-е свободно.
const BUSY = Object.freeze({ startDate: '2026-11-10', endDate: '2026-11-13' });

function interval(startDate, days) {
  return { startDate, endDate: addDays(startDate, days) };
}

test('overlaps: касание встык пересечением не является', () => {
  assert.equal(overlaps(BUSY, interval('2026-11-07', 3)), false, 'встык слева');
  assert.equal(overlaps(BUSY, interval('2026-11-13', 1)), false, 'встык справа');
});

test('overlaps: частичное наложение с любой стороны', () => {
  assert.equal(overlaps(BUSY, interval('2026-11-07', 4)), true, 'заходит слева');
  assert.equal(overlaps(BUSY, interval('2026-11-12', 2)), true, 'заходит справа');
});

test('overlaps: совпадение начала и вложенность', () => {
  assert.equal(overlaps(BUSY, interval('2026-11-10', 1)), true, 'начало совпадает');
  assert.equal(overlaps(BUSY, interval('2026-11-11', 1)), true, 'внутри занятого');
  assert.equal(overlaps(BUSY, interval('2026-11-09', 10)), true, 'полностью накрывает');
  assert.equal(overlaps(BUSY, BUSY), true, 'сам с собой');
});

test('overlaps симметричен и не задевает далёкие даты', () => {
  const other = interval('2026-11-12', 2);
  assert.equal(overlaps(BUSY, other), overlaps(other, BUSY));
  assert.equal(overlaps(BUSY, interval('2026-12-01', 3)), false);
  assert.equal(overlaps(BUSY, interval('2026-01-01', 3)), false);
});

test('isCalendarDate отличает формат от существования даты', () => {
  assert.equal(isCalendarDate('2026-11-10'), true);
  assert.equal(isCalendarDate('2028-02-29'), true);
  assert.equal(isCalendarDate('2026-02-29'), false);
  assert.equal(isCalendarDate('2026-02-30'), false);
  assert.equal(isCalendarDate('2026-13-01'), false);
  assert.equal(isCalendarDate('2026-00-10'), false);
  assert.equal(isCalendarDate('2026-11-00'), false);
  assert.equal(isCalendarDate('2026-1-5'), false);
});
