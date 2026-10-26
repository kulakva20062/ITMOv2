import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateRental, EXTRAS, DEPOSITS } from '../src/calc.js';
import { cars } from '../src/cars.js';

// Опорные машины: эконом 2400, комфорт 3800, бизнес 7200, внедорожник 4300.
const LARUS = cars.find((car) => car.id === 'larus-16');
const MIRTA = cars.find((car) => car.id === 'mirta-20');
const TAIGA = cars.find((car) => car.id === 'taiga-lift');

test('обычный расчёт: база за сутки, без скидки и опций', () => {
  const result = calculateRental({ carId: 'larus-16', days: 3 });

  assert.deepEqual(result, {
    base: 7200,
    discount: 0,
    extrasTotal: 0,
    insurance: 0,
    total: 7200,
    deposit: 10000,
  });
  assert.equal(result.base, LARUS.pricePerDay * 3);
});

test('extras можно передать пустым массивом — результат тот же', () => {
  assert.deepEqual(
    calculateRental({ carId: 'larus-16', days: 3, extras: [] }),
    calculateRental({ carId: 'larus-16', days: 3 }),
  );
});

test('граница скидки 6/7 суток: на 6 сутках скидки нет, на 7 — 10 %', () => {
  const six = calculateRental({ carId: 'larus-16', days: 6 });
  assert.equal(six.base, 14400);
  assert.equal(six.discount, 0);
  assert.equal(six.total, 14400);

  const seven = calculateRental({ carId: 'larus-16', days: 7 });
  assert.equal(seven.base, 16800);
  assert.equal(seven.discount, 1680);
  assert.equal(seven.total, 15120);
});

test('граница скидки 13/14 суток: 10 % против 15 %', () => {
  const thirteen = calculateRental({ carId: 'larus-16', days: 13 });
  assert.equal(thirteen.base, 31200);
  assert.equal(thirteen.discount, 3120);
  assert.equal(thirteen.total, 28080);

  const fourteen = calculateRental({ carId: 'larus-16', days: 14 });
  assert.equal(fourteen.base, 33600);
  assert.equal(fourteen.discount, 5040);
  assert.equal(fourteen.total, 28560);
});

test('скидка 15 % держится до верхней границы срока', () => {
  const thirty = calculateRental({ carId: 'larus-16', days: 30 });
  assert.equal(thirty.base, 72000);
  assert.equal(thirty.discount, 10800);
  assert.equal(thirty.total, 61200);
});

test('опции считаются за каждые сутки и не попадают под скидку', () => {
  const result = calculateRental({
    carId: 'larus-16',
    days: 3,
    extras: ['child-seat', 'extra-driver'],
  });

  assert.equal(result.extrasTotal, (300 + 500) * 3);
  assert.equal(result.discount, 0);
  assert.equal(result.total, 7200 + 2400);
});

test('детское кресло и второй водитель стоят по прайсу за сутки', () => {
  assert.equal(EXTRAS['child-seat'], 300);
  assert.equal(EXTRAS['extra-driver'], 500);

  const seat = calculateRental({ carId: 'larus-16', days: 5, extras: ['child-seat'] });
  assert.equal(seat.extrasTotal, 1500);

  const driver = calculateRental({ carId: 'larus-16', days: 5, extras: ['extra-driver'] });
  assert.equal(driver.extrasTotal, 2500);
});

test('опции суммируются со скидкой на длинном сроке', () => {
  const result = calculateRental({
    carId: 'mirta-20',
    days: 14,
    extras: ['child-seat'],
  });

  const base = MIRTA.pricePerDay * 14;
  assert.equal(result.base, base);
  assert.equal(result.discount, Math.round(base * 0.15));
  assert.equal(result.extrasTotal, 300 * 14);
  assert.equal(result.total, base - result.discount + result.extrasTotal);
});

test('полная страховка — 15 % от базы после скидки', () => {
  const plain = calculateRental({ carId: 'mirta-20', days: 7 });
  const insured = calculateRental({ carId: 'mirta-20', days: 7, extras: ['full-insurance'] });

  assert.equal(plain.base, 26600);
  assert.equal(plain.discount, 2660);
  assert.equal(insured.insurance, Math.round((26600 - 2660) * 0.15));
  assert.equal(insured.insurance, 3591);
  assert.equal(insured.extrasTotal, 0, 'страховка не входит в extrasTotal');
  assert.equal(insured.total, 26600 - 2660 + 3591);
});

test('страховка без скидки берёт 15 % от полной базы', () => {
  const result = calculateRental({ carId: 'larus-16', days: 2, extras: ['full-insurance'] });

  assert.equal(result.base, 4800);
  assert.equal(result.discount, 0);
  assert.equal(result.insurance, 720);
  assert.equal(result.total, 5520);
});

test('все суммы округлены до рубля', () => {
  // 4300 × 7 = 30100, скидка 3010, страховка 15 % от 27090 = 4063,5 → 4064.
  const result = calculateRental({ carId: 'taiga-lift', days: 7, extras: ['full-insurance'] });

  assert.equal(result.base, 30100);
  assert.equal(result.discount, 3010);
  assert.equal(result.insurance, 4064);
  assert.equal(result.total, 31154);

  for (const [key, value] of Object.entries(result)) {
    assert.ok(Number.isInteger(value), `${key} не округлён: ${value}`);
  }
});

test('залог зависит от класса машины и не входит в итог', () => {
  assert.deepEqual(DEPOSITS, {
    economy: 10000,
    comfort: 15000,
    business: 30000,
    suv: 25000,
  });

  assert.equal(calculateRental({ carId: 'larus-16', days: 1 }).deposit, 10000);
  assert.equal(calculateRental({ carId: 'mirta-20', days: 1 }).deposit, 15000);
  assert.equal(calculateRental({ carId: 'prima-sedan', days: 1 }).deposit, 30000);
  assert.equal(calculateRental({ carId: 'taiga-lift', days: 1 }).deposit, 25000);

  const result = calculateRental({ carId: 'taiga-lift', days: 2 });
  assert.equal(result.total, TAIGA.pricePerDay * 2);
  assert.equal(result.total, result.base - result.discount + result.extrasTotal + result.insurance);
});

test('у каждой машины автопарка есть залог своего класса', () => {
  for (const car of cars) {
    assert.equal(calculateRental({ carId: car.id, days: 1 }).deposit, DEPOSITS[car.class]);
  }
});

test('итог всегда равен сумме слагаемых без залога', () => {
  for (const days of [1, 6, 7, 13, 14, 30]) {
    for (const extras of [[], ['child-seat'], ['extra-driver', 'full-insurance'], Object.keys(EXTRAS)]) {
      const r = calculateRental({ carId: 'prima-long', days, extras });
      assert.equal(
        r.total,
        r.base - r.discount + r.extrasTotal + r.insurance,
        `срок ${days}, опции ${extras.join()}`,
      );
    }
  }
});

test('нецелые сутки — RangeError', () => {
  assert.throws(() => calculateRental({ carId: 'larus-16', days: 2.5 }), RangeError);
  assert.throws(() => calculateRental({ carId: 'larus-16', days: 0.5 }), RangeError);
});

test('сутки вне 1–30 — RangeError', () => {
  for (const days of [0, -1, 31, 100]) {
    assert.throws(
      () => calculateRental({ carId: 'larus-16', days }),
      RangeError,
      `days=${days} должен падать`,
    );
  }
});

test('не-число в сутках — RangeError', () => {
  for (const days of ['3', '', null, undefined, NaN, Infinity, {}, [3]]) {
    assert.throws(
      () => calculateRental({ carId: 'larus-16', days }),
      RangeError,
      `days=${String(days)} должен падать`,
    );
  }
});

test('сообщение об ошибке срока называет допустимый диапазон', () => {
  assert.throws(() => calculateRental({ carId: 'larus-16', days: 31 }), {
    name: 'RangeError',
    message: /1.*30/,
  });
});

test('неизвестный carId — RangeError с упоминанием id', () => {
  assert.throws(() => calculateRental({ carId: 'ferrari-f50', days: 3 }), {
    name: 'RangeError',
    message: /ferrari-f50/,
  });
  assert.throws(() => calculateRental({ carId: '', days: 3 }), RangeError);
  assert.throws(() => calculateRental({ days: 3 }), RangeError);
});

test('неизвестная опция — RangeError с упоминанием опции', () => {
  assert.throws(() => calculateRental({ carId: 'larus-16', days: 3, extras: ['gps'] }), {
    name: 'RangeError',
    message: /gps/,
  });
  assert.throws(
    () => calculateRental({ carId: 'larus-16', days: 3, extras: ['child-seat', 'pet'] }),
    RangeError,
  );
});

test('extras не массив — RangeError', () => {
  for (const extras of ['child-seat', 42, {}]) {
    assert.throws(
      () => calculateRental({ carId: 'larus-16', days: 3, extras }),
      RangeError,
      `extras=${String(extras)} должен падать`,
    );
  }
});

test('вызов без аргумента — RangeError', () => {
  assert.throws(() => calculateRental(), RangeError);
});

test('функция чистая: не мутирует переданные extras', () => {
  const extras = ['child-seat', 'full-insurance'];
  calculateRental({ carId: 'larus-16', days: 4, extras });
  assert.deepEqual(extras, ['child-seat', 'full-insurance']);
});
