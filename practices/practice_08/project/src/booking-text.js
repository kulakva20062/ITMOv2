// Видимые строки формы заявки и выбор текста по коду ошибки.
// Единственный источник формулировок UI: ни разметка, ни src/main.js своих строк не содержат.
// Источник имён кодов, состояний и текстов — specs/contracts/booking-contract.md §7.
// Чистый модуль: без DOM, сети, часов и случайности. Длины и горизонт берутся из src/booking.js.
import {
  BOOKING_HORIZON_DAYS,
  ERROR_CODES,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from './booking.js';

// Машиночитаемые имена состояний формы (контракт §7), в порядке контракта.
// Объявлены здесь, рядом с русскими подписями BOOKING_TEXT.states; src/booking-form.js
// их реэкспортирует, чтобы не возникло кольцевого импорта между двумя модулями.
export const BOOKING_STATES = Object.freeze({
  NO_ESTIMATE: 'no-estimate',
  EDITING: 'editing',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  UNAVAILABLE: 'unavailable',
});

// Заглушка телефона из AGENTS.md: в подсказке и в текстах ошибок один и тот же образец.
const PHONE_SAMPLE = '+7 000 000-00-00';

function deepFreeze(value) {
  for (const inner of Object.values(value)) {
    if (inner && typeof inner === 'object') deepFreeze(inner);
  }

  return Object.freeze(value);
}

export const BOOKING_TEXT = deepFreeze({
  section: {
    rail: 'Заявка',
    heading: 'Заявка на бронирование',
    note:
      'Срок и опции берём из расчёта выше. Цену сервер пересчитает сам и ответит номером заявки — ' +
      'платить и подтверждать ничего не нужно.',
  },

  labels: {
    name: 'Имя',
    phone: 'Телефон',
    startDate: 'Дата начала аренды',
  },

  hints: {
    name: 'Как к вам обращаться при подтверждении',
    phone: `Для подтверждения брони. Образец: ${PHONE_SAMPLE}`,
    startDate: 'Выдача машины в день начала аренды',
  },

  // Пояснение к звёздочке у подписей. Строка целиком здесь, а не собирается в CSS.
  required: '* — обязательное поле',

  buttons: {
    submit: 'Отправить заявку',
    submitting: 'Отправляем заявку…',
    again: 'Оформить ещё одну заявку',
  },

  // Русские подписи состояний §7 по машиночитаемым именам BOOKING_STATES.
  states: {
    [BOOKING_STATES.NO_ESTIMATE]: 'нет расчёта',
    [BOOKING_STATES.EDITING]: 'заполнение',
    [BOOKING_STATES.SUBMITTING]: 'отправка',
    [BOOKING_STATES.SUCCESS]: 'успех',
    [BOOKING_STATES.UNAVAILABLE]: 'сервер недоступен',
  },

  snapshot: {
    heading: 'Из расчёта выше',
    car: 'Машина',
    days: 'Срок',
    extras: 'Опции',
    total: 'Итого',
    noExtras: 'без опций',
  },

  noEstimate: {
    text: 'Сначала рассчитайте стоимость — срок и опции заявка берёт из расчёта.',
    link: 'Перейти к расчёту',
  },

  // Отказ по carId / days / extras: снимок расчёта разошёлся с сервером (контракт §7).
  stale: 'Расчёт устарел — пересчитайте стоимость в калькуляторе.',

  // Нераспознанный код, нераспознанное поле и транспортные коды 4xx.
  rejected: 'Заявка не принята. Проверьте поля и отправьте ещё раз.',

  // 5xx, таймаут, разрыв связи, неразобранный ответ.
  unavailable:
    'Заявка не отправлена — сервер не ответил. Проверьте связь и нажмите ' +
    '«Отправить заявку» ещё раз.',

  submitting: 'Отправляем заявку…',

  success: {
    heading: 'Заявка принята',
    announce: (id) => `Заявка № ${id} принята.`,
    id: 'Номер заявки',
    car: 'Машина',
    startDate: 'Дата начала',
    days: 'Срок',
    total: 'Итого',
    // FR-018: сумма из ответа разошлась с итогом снимка.
    correction: (was, now) => `Итог уточнён сервером: было ${was}, стало ${now}.`,
  },

  // Текст занятых дат, когда conflict прочитать не удалось (контракт §7).
  conflictFallback:
    'Эта машина уже занята на выбранные даты. Выберите другую дату начала или другую машину.',
});

// Поля, по которым отказ означает устаревший снимок расчёта, а не ошибку ввода (контракт §7).
const SNAPSHOT_FIELDS = new Set(['carId', 'days', 'extras']);

// Короткая или длинная ветка name_length. Контракт §7: ветку выбирает UI по собственному
// значению поля, сервер отдаёт один код на оба случая. Длину считает вызывающий —
// правило подсчёта живёт в src/booking.js и здесь не дублируется.
function nameLengthText(length) {
  const short = typeof length === 'number' ? length < NAME_MIN_LENGTH : true;

  return short
    ? `Имя слишком короткое — не меньше ${NAME_MIN_LENGTH} символов.`
    : `Имя слишком длинное — не больше ${NAME_MAX_LENGTH} символов.`;
}

// Тексты ошибок полей: поле -> код -> текст. Ключ двойной, потому что код `required`
// встречается у всех полей, а текст у каждого свой.
const FIELD_TEXT = {
  name: {
    [ERROR_CODES.REQUIRED]: () => 'Укажите имя — так мы обратимся к вам при подтверждении.',
    [ERROR_CODES.NAME_LENGTH]: (ctx) => nameLengthText(ctx.length),
    [ERROR_CODES.NAME_CHARSET]: () => 'Имя — только буквы, пробел, дефис и апостроф.',
  },

  phone: {
    [ERROR_CODES.REQUIRED]: () => 'Укажите телефон — на него мы позвоним для подтверждения.',
    [ERROR_CODES.PHONE_CHARSET]: () =>
      `Телефон должен содержать 11 цифр, например ${PHONE_SAMPLE}.`,
    [ERROR_CODES.PHONE_INVALID]: () =>
      `Телефон должен содержать 11 цифр, например ${PHONE_SAMPLE}.`,
  },

  startDate: {
    [ERROR_CODES.REQUIRED]: () => 'Выберите дату начала аренды.',
    [ERROR_CODES.DATE_FORMAT]: () => 'Выберите дату начала аренды.',
    [ERROR_CODES.DATE_INVALID]: () => 'Выберите дату начала аренды.',
    [ERROR_CODES.DATE_PAST]: () =>
      'Дата начала не может быть в прошлом — выберите сегодня или позже.',
    [ERROR_CODES.DATE_TOO_FAR]: (ctx) =>
      `Дата начала не дальше ${ctx.horizon ?? BOOKING_HORIZON_DAYS} дней от сегодня.`,
    [ERROR_CODES.DATE_CONFLICT]: (ctx) =>
      `Эта машина занята с ${ctx.from} по ${ctx.to}. ` +
      'Выберите другую дату начала или другую машину.',
  },
};

// Коды, которые по контракту §7 уводят форму в «сервер недоступен».
const UNAVAILABLE_CODES = new Set(['internal_error']);

// Коды транспортных отказов 4xx: общее сообщение над кнопкой, состояние не меняется.
const REJECTED_CODES = new Set([
  'invalid_json',
  'unsupported_media_type',
  'payload_too_large',
  'method_not_allowed',
  'not_found',
  'booking_not_found',
  'validation_failed',
]);

// Что показать по коду ошибки: куда, в каком состоянии и каким текстом (контракт §7).
// Исключений не бросает: нераспознанный код и нераспознанное поле — ожидаемый вход.
// context: { length } для name_length, { horizon } для date_too_far, { from, to } для date_conflict.
export function errorView(code, field, context = {}) {
  if (UNAVAILABLE_CODES.has(code)) {
    return {
      scope: 'status',
      field: null,
      state: BOOKING_STATES.UNAVAILABLE,
      text: BOOKING_TEXT.unavailable,
    };
  }

  // Снимок расчёта разошёлся: поля недоступны, помогает только пересчёт.
  if (SNAPSHOT_FIELDS.has(field)) {
    return {
      scope: 'form',
      field: null,
      state: BOOKING_STATES.NO_ESTIMATE,
      text: BOOKING_TEXT.stale,
    };
  }

  const text = FIELD_TEXT[field]?.[code];
  if (text && !REJECTED_CODES.has(code)) {
    return {
      scope: 'field',
      field,
      state: BOOKING_STATES.EDITING,
      text: text(context),
    };
  }

  return {
    scope: 'form',
    field: null,
    state: BOOKING_STATES.EDITING,
    text: BOOKING_TEXT.rejected,
  };
}
