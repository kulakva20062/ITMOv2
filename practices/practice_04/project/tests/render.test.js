import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carRowHtml, fleetHtml } from '../src/render.js';
import { cars } from '../src/cars.js';
import { formatPrice } from '../src/format.js';

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
