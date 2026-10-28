import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  carRowHtml,
  fleetHtml,
  carOptionsHtml,
  extrasFieldsHtml,
  receiptHtml,
} from '../src/render.js';
import { cars } from '../src/cars.js';
import { formatPrice } from '../src/format.js';
import { calculateRental, EXTRA_OPTIONS } from '../src/calc.js';

const sample = {
  id: 'larus-16',
  model: 'Ларус 1.6',
  class: 'economy',
  gearbox: 'manual',
  seats: 5,
  pricePerDay: 2400,
};

test('строка автопарка несёт data-car-id', () => {
  assert.match(carRowHtml(sample), /data-car-id="larus-16"/);
});

test('строка автопарка показывает все поля машины', () => {
  const html = carRowHtml(sample);
  assert.match(html, /Ларус 1\.6/);
  assert.match(html, /эконом/i);
  assert.match(html, /механик/i);
  assert.match(html, /5\s*мест/);
  assert.ok(html.includes(formatPrice(sample.pricePerDay)), 'нет цены за сутки');
});

test('в строке автопарка есть кнопка «Рассчитать» с id машины', () => {
  const html = carRowHtml(sample);
  assert.match(html, /<button[^>]*>\s*Рассчитать\s*<\/button>/);
  assert.match(html, /data-calc-for="larus-16"/);
});

test('fleetHtml отдаёт по одной строке на машину', () => {
  const html = fleetHtml(cars);
  const found = html.match(/data-car-id="/g) ?? [];
  assert.equal(found.length, cars.length);
});

test('опасные символы в данных экранируются', () => {
  const html = carRowHtml({ ...sample, id: 'a"b', model: '<b>Тест</b>' });
  assert.match(html, /data-car-id="a&quot;b"/);
  assert.ok(!html.includes('<b>Тест</b>'), 'модель вставлена как разметка');
  assert.match(html, /&lt;b&gt;Тест&lt;\/b&gt;/);
});

test('в списке калькулятора по одному option на машину с ценой', () => {
  const html = carOptionsHtml(cars);
  assert.equal((html.match(/<option/g) ?? []).length, cars.length);
  for (const car of cars) {
    assert.ok(html.includes(`value="${car.id}"`), `нет option для ${car.id}`);
  }
  assert.ok(html.includes(formatPrice(cars[0].pricePerDay)), 'в option нет цены');
});

test('выбранная машина помечена selected ровно один раз', () => {
  const html = carOptionsHtml(cars, 'mirta-20');
  assert.equal((html.match(/selected/g) ?? []).length, 1);
  assert.match(html, /value="mirta-20" selected/);
});

test('чекбоксы опций покрывают все опции расчёта', () => {
  const html = extrasFieldsHtml();
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, EXTRA_OPTIONS.length);
  for (const option of EXTRA_OPTIONS) {
    assert.ok(html.includes(`value="${option}"`), `нет чекбокса ${option}`);
  }
  assert.ok(html.includes(formatPrice(300)), 'нет цены детского кресла');
  assert.ok(html.includes(formatPrice(500)), 'нет цены второго водителя');
  assert.match(html, /15\s*%/, 'нет процента страховки');
});

test('расшифровка показывает базу, итог и залог', () => {
  const car = cars.find((item) => item.id === 'larus-16');
  const result = calculateRental({ carId: car.id, days: 3 });
  const html = receiptHtml(result, { car, days: 3 });

  assert.ok(html.includes(formatPrice(result.base)), 'нет базы');
  assert.ok(html.includes(formatPrice(result.total)), 'нет итога');
  assert.ok(html.includes(formatPrice(result.deposit)), 'нет залога');
  assert.match(html, /Итого/);
  assert.match(html, /Залог/);
});

test('строки скидки, опций и страховки появляются только когда не нулевые', () => {
  const car = cars.find((item) => item.id === 'larus-16');

  const plain = receiptHtml(calculateRental({ carId: car.id, days: 3 }), { car, days: 3 });
  assert.ok(!/Скидка/.test(plain), 'скидка показана при нулевой скидке');
  assert.ok(!/Опции/.test(plain), 'опции показаны при пустом списке');
  assert.ok(!/страховка/i.test(plain), 'страховка показана, когда не выбрана');

  const full = receiptHtml(
    calculateRental({ carId: car.id, days: 14, extras: ['child-seat', 'full-insurance'] }),
    { car, days: 14 },
  );
  assert.match(full, /Скидка за срок, 15 %/);
  assert.match(full, /Опции/);
  assert.match(full, /Полная страховка/);
});

test('скидка в расшифровке показана со знаком минус', () => {
  const car = cars.find((item) => item.id === 'larus-16');
  const result = calculateRental({ carId: car.id, days: 7 });
  const html = receiptHtml(result, { car, days: 7 });

  assert.match(html, /Скидка за срок, 10 %/);
  assert.ok(html.includes(`−${formatPrice(result.discount)}`), 'скидка без минуса');
});

test('модель в расшифровке экранируется', () => {
  const car = { ...sample, model: '<i>Х</i>' };
  const html = receiptHtml(calculateRental({ carId: 'larus-16', days: 2 }), { car, days: 2 });
  assert.ok(!html.includes('<i>'), 'модель вставлена как разметка');
});
