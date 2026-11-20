// Расчёт стоимости аренды: чистая функция, без обращений к DOM.
import { cars } from './cars.js';

export const MIN_DAYS = 1;
export const MAX_DAYS = 30;

// Опции с ценой за сутки. Полная страховка считается от базы после скидки,
// поэтому в этом прайсе её нет — она живёт отдельной константой.
export const EXTRAS = {
  'child-seat': 300,
  'extra-driver': 500,
};

export const FULL_INSURANCE = 'full-insurance';
export const INSURANCE_RATE = 0.15;

export const EXTRA_OPTIONS = [...Object.keys(EXTRAS), FULL_INSURANCE];

export const EXTRA_LABELS = {
  'child-seat': 'Детское кресло',
  'extra-driver': 'Второй водитель',
  [FULL_INSURANCE]: 'Полная страховка',
};

export const DEPOSITS = {
  economy: 10000,
  comfort: 15000,
  business: 30000,
  suv: 25000,
};

// Скидка за срок: от длинного срока к короткому, первый подошедший порог и берём.
const DISCOUNTS = [
  { from: 14, rate: 0.15 },
  { from: 7, rate: 0.1 },
];

export function discountRate(days) {
  return DISCOUNTS.find((step) => days >= step.from)?.rate ?? 0;
}

export function calculateRental({ carId, days, extras = [] } = {}) {
  const car = cars.find((item) => item.id === carId);
  if (!car) {
    throw new RangeError(`Нет такой машины в автопарке: ${String(carId)}. Выберите машину из списка.`);
  }

  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    throw new RangeError(
      `Срок аренды — целое число суток от ${MIN_DAYS} до ${MAX_DAYS}. Получено: ${String(days)}.`,
    );
  }

  if (!Array.isArray(extras)) {
    throw new RangeError('Опции передаются списком. Допустимые опции: ' + EXTRA_OPTIONS.join(', ') + '.');
  }

  for (const extra of extras) {
    if (!EXTRA_OPTIONS.includes(extra)) {
      throw new RangeError(
        `Нет такой опции: ${String(extra)}. Допустимые опции: ${EXTRA_OPTIONS.join(', ')}.`,
      );
    }
  }

  const base = Math.round(car.pricePerDay * days);
  const discount = Math.round(base * discountRate(days));

  const perDay = extras.reduce((sum, extra) => sum + (EXTRAS[extra] ?? 0), 0);
  const extrasTotal = Math.round(perDay * days);

  const insurance = extras.includes(FULL_INSURANCE)
    ? Math.round((base - discount) * INSURANCE_RATE)
    : 0;

  return {
    base,
    discount,
    extrasTotal,
    insurance,
    total: base - discount + extrasTotal + insurance,
    deposit: DEPOSITS[car.class],
  };
}
