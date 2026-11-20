// Логика заявки на бронирование: чистые функции без обращений к DOM, сети и часам.
// Единственный аксессор часов — todayUtc(); всё остальное получает дату параметром.
// Источник имён полей и кодов ошибок — specs/contracts/booking-contract.md.
// Модуль импортируется и браузером, и Node: node:-импортов здесь быть не должно.
import { cars } from './cars.js';
import { EXTRA_OPTIONS, MAX_DAYS, MIN_DAYS } from './calc.js';
import { formatDate } from './format.js';

// Горизонт бронирования живёт только здесь: и проверка, и текст ошибки берут его отсюда.
export const BOOKING_HORIZON_DAYS = 365;

// Все 16 кодов полей каталога контракта §7. Единственный источник этих строк.
export const ERROR_CODES = Object.freeze({
  REQUIRED: 'required',
  CAR_UNKNOWN: 'car_unknown',
  DAYS_NOT_INTEGER: 'days_not_integer',
  DAYS_OUT_OF_RANGE: 'days_out_of_range',
  EXTRAS_NOT_ARRAY: 'extras_not_array',
  EXTRA_UNKNOWN: 'extra_unknown',
  EXTRAS_DUPLICATE: 'extras_duplicate',
  NAME_LENGTH: 'name_length',
  NAME_CHARSET: 'name_charset',
  PHONE_CHARSET: 'phone_charset',
  PHONE_INVALID: 'phone_invalid',
  DATE_FORMAT: 'date_format',
  DATE_INVALID: 'date_invalid',
  DATE_PAST: 'date_past',
  DATE_TOO_FAR: 'date_too_far',
  DATE_CONFLICT: 'date_conflict',
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86400000;

// Сегодняшняя дата UTC. Канонический способ контракта §2.
export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function toEpochDay(iso) {
  if (typeof iso !== 'string' || !ISO_DATE.test(iso)) {
    return null;
  }

  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  const stamp = Date.UTC(year, month - 1, day);
  const back = new Date(stamp);

  // Date.UTC молча переносит 2026-02-30 на 2 марта — сверяем компоненты обратно.
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() + 1 !== month ||
    back.getUTCDate() !== day
  ) {
    return null;
  }

  return stamp / MS_PER_DAY;
}

// Существует ли такая календарная дата. Формат проверяется отдельно от существования.
export function isCalendarDate(iso) {
  return toEpochDay(iso) !== null;
}

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;

// Имя: буквы кириллицы и латиницы, пробел, дефис, апостроф. Цифрам и символам тут не место.
const NAME_ALLOWED = /^[\p{Script=Cyrillic}\p{Script=Latin}\s'’-]+$/u;
const HAS_LETTER = /\p{L}/u;

// Телефон до нормализации: цифры, пробелы, дефисы, скобки и необязательный ведущий плюс.
const PHONE_ALLOWED = /^\+?[\d\s()-]+$/;

// Длина имени считается кодовыми точками: суррогатная пара — один символ, а не два.
function codePointLength(value) {
  return [...value].length;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

// Код ошибки имени или null. Один порядок проверок для isValidName и validateBooking:
// пусто -> required, затем длина, затем набор символов.
function nameErrorCode(value) {
  if (isBlank(value)) {
    return ERROR_CODES.REQUIRED;
  }

  if (typeof value !== 'string') {
    return ERROR_CODES.NAME_CHARSET;
  }

  const trimmed = value.trim();
  const length = codePointLength(trimmed);

  if (length < NAME_MIN_LENGTH || length > NAME_MAX_LENGTH) {
    return ERROR_CODES.NAME_LENGTH;
  }

  if (!NAME_ALLOWED.test(trimmed) || !HAS_LETTER.test(trimmed)) {
    return ERROR_CODES.NAME_CHARSET;
  }

  return null;
}

// Проходит ли имя правило контракта §4. Предикат без диагностики — коды даёт validateBooking.
export function isValidName(value) {
  return nameErrorCode(value) === null;
}

// Код ошибки телефона или null: пусто -> required, посторонние символы -> phone_charset,
// неверное число цифр или чужой код страны -> phone_invalid.
function phoneErrorCode(value) {
  if (isBlank(value)) {
    return ERROR_CODES.REQUIRED;
  }

  if (typeof value !== 'string' || !PHONE_ALLOWED.test(value.trim())) {
    return ERROR_CODES.PHONE_CHARSET;
  }

  return normalizePhone(value) === null ? ERROR_CODES.PHONE_INVALID : null;
}

// Состоит ли телефон из разрешённых символов. Отдельно от нормализации, чтобы
// можно было отличить phone_charset от phone_invalid.
function hasAllowedPhoneChars(value) {
  return typeof value === 'string' && PHONE_ALLOWED.test(value.trim());
}

// Нормализация по контракту §6: "+7 000 000-00-00" -> "+70000000000".
// Возвращает null, если нормализация невозможна.
export function normalizePhone(value) {
  if (!hasAllowedPhoneChars(value)) {
    return null;
  }

  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;

  if (national.length !== 11 || !national.startsWith('7')) {
    return null;
  }

  return `+${national}`;
}

// Сдвиг ISO-даты на n календарных суток UTC. n может быть отрицательным.
export function addDays(iso, n) {
  const epochDay = toEpochDay(iso);
  if (epochDay === null) {
    throw new RangeError(`Дата передаётся строкой вида ГГГГ-ММ-ДД. Получено: ${String(iso)}.`);
  }

  if (!Number.isInteger(n)) {
    throw new RangeError(`Сдвиг в сутках — целое число. Получено: ${String(n)}.`);
  }

  return new Date((epochDay + n) * MS_PER_DAY).toISOString().slice(0, 10);
}

// Пересечение полуоткрытых интервалов [startDate, endDate) по правилу контракта §8.
// Касание встык (aEnd === bStart) пересечением не считается.
// Про carId функция не знает: отбор по машине делает вызывающий.
export function overlaps(a, b) {
  return a.startDate < b.endDate && b.startDate < a.endDate;
}

// Формулировки для тела ответа API: они нужны curl, логам и тестам.
// UI рендерит по code и эти строки не показывает (контракт §5 и §7).
const MESSAGES = {
  [ERROR_CODES.CAR_UNKNOWN]: (ctx) =>
    `Нет такой машины в автопарке: ${ctx.received}. Выберите машину из списка.`,
  [ERROR_CODES.DAYS_NOT_INTEGER]: () =>
    `Срок аренды — целое число суток от ${MIN_DAYS} до ${MAX_DAYS}.`,
  [ERROR_CODES.DAYS_OUT_OF_RANGE]: (ctx) =>
    `Срок аренды — целое число суток от ${MIN_DAYS} до ${MAX_DAYS}. Получено: ${ctx.received}.`,
  [ERROR_CODES.EXTRAS_NOT_ARRAY]: () =>
    `Опции передаются списком. Допустимые опции: ${EXTRA_OPTIONS.join(', ')}.`,
  [ERROR_CODES.EXTRA_UNKNOWN]: (ctx) =>
    `Нет такой опции: ${ctx.received}. Допустимые опции: ${EXTRA_OPTIONS.join(', ')}.`,
  [ERROR_CODES.EXTRAS_DUPLICATE]: (ctx) =>
    `Опция повторяется: ${ctx.received}. Каждая опция указывается один раз.`,
  [ERROR_CODES.NAME_LENGTH]: () => `Имя — от ${NAME_MIN_LENGTH} до ${NAME_MAX_LENGTH} символов.`,
  [ERROR_CODES.NAME_CHARSET]: () => 'Имя — только буквы, пробел, дефис и апостроф.',
  [ERROR_CODES.PHONE_CHARSET]: () =>
    'Телефон — 11 цифр, например +7 000 000-00-00. Допустимы цифры, пробелы, дефисы, скобки и ведущий плюс.',
  [ERROR_CODES.PHONE_INVALID]: (ctx) =>
    `Телефон — 11 цифр, например +7 000 000-00-00. Получено цифр: ${ctx.digits}.`,
  [ERROR_CODES.DATE_FORMAT]: (ctx) =>
    `Дата начала аренды — строка вида ГГГГ-ММ-ДД. Получено: ${ctx.received}.`,
  [ERROR_CODES.DATE_INVALID]: (ctx) => `Такой даты нет в календаре: ${ctx.received}.`,
  [ERROR_CODES.DATE_PAST]: (ctx) =>
    `Дата начала аренды не может быть в прошлом. Сегодня: ${ctx.today}.`,
  [ERROR_CODES.DATE_TOO_FAR]: (ctx) =>
    `Дата начала аренды не дальше ${BOOKING_HORIZON_DAYS} суток от сегодня. Последняя доступная: ${ctx.limit}.`,
  [ERROR_CODES.DATE_CONFLICT]: (ctx) => `Занято с ${ctx.from} по ${ctx.to}.`,
};

const REQUIRED_MESSAGES = {
  carId: 'Выберите машину из списка.',
  days: `Укажите срок аренды в сутках: от ${MIN_DAYS} до ${MAX_DAYS}.`,
  name: 'Укажите имя.',
  phone: 'Укажите телефон.',
  startDate: 'Укажите дату начала аренды.',
};

// Собирает запись об ошибке поля. Единственное место, где код превращается в текст.
export function fieldError(field, code, context = {}) {
  const message =
    code === ERROR_CODES.REQUIRED
      ? REQUIRED_MESSAGES[field]
      : MESSAGES[code]({ ...context, field });

  return { field, code, message };
}

// Тела ответа 409: поле conflict остаётся в ISO-датах полуоткрытого интервала,
// а в формулировке называется последний занятый день — addDays(endDate, -1) (контракт §8).
export function conflictView(conflict) {
  const from = formatDate(conflict.startDate);
  const to = formatDate(addDays(conflict.endDate, -1));

  return {
    message: `Эта машина занята с ${from} по ${to}. Выберите другие даты или другую машину.`,
    fields: [fieldError('startDate', ERROR_CODES.DATE_CONFLICT, { from, to })],
  };
}

function validateCarId(value, errors) {
  if (isBlank(value)) {
    errors.push(fieldError('carId', ERROR_CODES.REQUIRED));
    return null;
  }

  const car = cars.find((item) => item.id === value);
  if (!car) {
    errors.push(fieldError('carId', ERROR_CODES.CAR_UNKNOWN, { received: String(value) }));
    return null;
  }

  return car.id;
}

function validateDays(value, errors) {
  if (value === undefined || value === null || value === '') {
    errors.push(fieldError('days', ERROR_CODES.REQUIRED));
    return null;
  }

  if (!Number.isInteger(value)) {
    errors.push(fieldError('days', ERROR_CODES.DAYS_NOT_INTEGER, { received: String(value) }));
    return null;
  }

  if (value < MIN_DAYS || value > MAX_DAYS) {
    errors.push(fieldError('days', ERROR_CODES.DAYS_OUT_OF_RANGE, { received: String(value) }));
    return null;
  }

  return value;
}

function validateExtras(value, errors) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    errors.push(fieldError('extras', ERROR_CODES.EXTRAS_NOT_ARRAY));
    return null;
  }

  const seen = new Set();
  for (const extra of value) {
    if (!EXTRA_OPTIONS.includes(extra)) {
      errors.push(fieldError('extras', ERROR_CODES.EXTRA_UNKNOWN, { received: String(extra) }));
      return null;
    }

    if (seen.has(extra)) {
      errors.push(fieldError('extras', ERROR_CODES.EXTRAS_DUPLICATE, { received: String(extra) }));
      return null;
    }

    seen.add(extra);
  }

  // Канонический порядок: ответ не зависит от порядка чекбоксов в форме (контракт §5).
  return EXTRA_OPTIONS.filter((extra) => seen.has(extra));
}

function validateName(value, errors) {
  const code = nameErrorCode(value);
  if (code) {
    errors.push(fieldError('name', code));
    return null;
  }

  return value.trim();
}

function validatePhone(value, errors) {
  const code = phoneErrorCode(value);
  if (code) {
    const digits = typeof value === 'string' ? value.replace(/\D/g, '').length : 0;
    errors.push(fieldError('phone', code, { digits }));
    return null;
  }

  return normalizePhone(value);
}

function validateStartDate(value, today, errors) {
  if (isBlank(value)) {
    errors.push(fieldError('startDate', ERROR_CODES.REQUIRED));
    return null;
  }

  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    errors.push(fieldError('startDate', ERROR_CODES.DATE_FORMAT, { received: String(value) }));
    return null;
  }

  if (!isCalendarDate(value)) {
    errors.push(fieldError('startDate', ERROR_CODES.DATE_INVALID, { received: value }));
    return null;
  }

  // ISO-даты сравниваются как строки: порядок совпадает с хронологическим.
  if (value < today) {
    errors.push(fieldError('startDate', ERROR_CODES.DATE_PAST, { today, received: value }));
    return null;
  }

  const limit = addDays(today, BOOKING_HORIZON_DAYS);
  if (value > limit) {
    errors.push(fieldError('startDate', ERROR_CODES.DATE_TOO_FAR, { limit, received: value }));
    return null;
  }

  return value;
}

// Проверяет тело заявки по правилам контракта §4 и §6.
// today — сегодняшняя дата UTC, обязательный параметр: к часам функция не обращается.
// Ошибки собираются по всем полям за один проход, порядок записей стабилен.
export function validateBooking(payload, today) {
  if (!ISO_DATE.test(String(today))) {
    throw new RangeError(`Сегодняшняя дата передаётся строкой ГГГГ-ММ-ДД. Получено: ${String(today)}.`);
  }

  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];

  const carId = validateCarId(source.carId, errors);
  const days = validateDays(source.days, errors);
  const extras = validateExtras(source.extras, errors);
  const name = validateName(source.name, errors);
  const phone = validatePhone(source.phone, errors);
  const startDate = validateStartDate(source.startDate, today, errors);

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return {
    ok: true,
    errors: [],
    value: {
      carId,
      days,
      extras,
      name,
      phone,
      startDate,
      endDate: addDays(startDate, days),
    },
  };
}
