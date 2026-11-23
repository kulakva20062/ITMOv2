import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTER_ANY,
  filterCars,
  filterOptionsHtml,
  countLabel,
  EMPTY_MESSAGE,
} from '../src/filter.js';
import { cars, CAR_CLASSES, GEARBOXES, CLASS_LABELS, GEARBOX_LABELS } from '../src/cars.js';

test('без ограничений виден весь автопарк в прежнем порядке', () => {
  const all = filterCars(cars, { carClass: FILTER_ANY, gearbox: FILTER_ANY });
  assert.deepEqual(
    all.map((car) => car.id),
    cars.map((car) => car.id),
  );
});

test('отсутствующие значения равны «любому»', () => {
  assert.equal(filterCars(cars, {}).length, cars.length);
  assert.equal(filterCars(cars).length, cars.length);
});

test('отбор по классу оставляет только машины этого класса', () => {
  const suv = filterCars(cars, { carClass: 'suv' });
  assert.ok(suv.length > 0, 'внедорожников нет в данных');
  for (const car of suv) {
    assert.equal(car.class, 'suv');
  }
  assert.equal(suv.length, cars.filter((car) => car.class === 'suv').length);
});

test('отбор по коробке оставляет только машины с этой коробкой', () => {
  const manual = filterCars(cars, { gearbox: 'manual' });
  assert.ok(manual.length > 0, 'машин на механике нет в данных');
  for (const car of manual) {
    assert.equal(car.gearbox, 'manual');
  }
  assert.equal(manual.length, cars.filter((car) => car.gearbox === 'manual').length);
});

test('класс и коробка сочетаются по И', () => {
  const found = filterCars(cars, { carClass: 'suv', gearbox: 'manual' });
  for (const car of found) {
    assert.equal(car.class, 'suv');
    assert.equal(car.gearbox, 'manual');
  }
  assert.equal(
    found.length,
    cars.filter((car) => car.class === 'suv' && car.gearbox === 'manual').length,
  );
});

test('пустое сочетание отдаёт пустой список', () => {
  // В автопарке нет бизнес-класса на механике — пустой результат достижим обычным выбором.
  assert.ok(!cars.some((car) => car.class === 'business' && car.gearbox === 'manual'));
  assert.deepEqual(filterCars(cars, { carClass: 'business', gearbox: 'manual' }), []);
});

test('отбор сохраняет порядок исходного массива', () => {
  const automatic = filterCars(cars, { gearbox: 'automatic' });
  const expected = cars.filter((car) => car.gearbox === 'automatic').map((car) => car.id);
  assert.deepEqual(
    automatic.map((car) => car.id),
    expected,
  );
});

test('отбор не мутирует исходный массив', () => {
  const before = cars.map((car) => car.id);
  filterCars(cars, { carClass: 'economy', gearbox: 'manual' });
  assert.deepEqual(
    cars.map((car) => car.id),
    before,
  );
});

test('неизвестный класс — RangeError с перечислением допустимых', () => {
  assert.throws(
    () => filterCars(cars, { carClass: 'premium' }),
    (error) => {
      assert.ok(error instanceof RangeError);
      assert.match(error.message, /premium/);
      for (const carClass of CAR_CLASSES) {
        assert.ok(error.message.includes(carClass), `в тексте нет класса ${carClass}`);
      }
      return true;
    },
  );
});

test('неизвестная коробка — RangeError с перечислением допустимых', () => {
  assert.throws(
    () => filterCars(cars, { gearbox: 'robot' }),
    (error) => {
      assert.ok(error instanceof RangeError);
      assert.match(error.message, /robot/);
      for (const gearbox of GEARBOXES) {
        assert.ok(error.message.includes(gearbox), `в тексте нет коробки ${gearbox}`);
      }
      return true;
    },
  );
});

test('опции селекта: вариант «любой» плюс по одной опции на значение', () => {
  const html = filterOptionsHtml(CAR_CLASSES, CLASS_LABELS, 'Любой класс');
  assert.equal((html.match(/<option/g) ?? []).length, CAR_CLASSES.length + 1);
  for (const carClass of CAR_CLASSES) {
    assert.ok(html.includes(`value="${carClass}"`), `нет опции ${carClass}`);
    assert.ok(html.includes(CLASS_LABELS[carClass]), `нет подписи ${carClass}`);
  }
});

test('вариант «любой» стоит первым, выбран и ровно один раз', () => {
  const html = filterOptionsHtml(GEARBOXES, GEARBOX_LABELS, 'Любая коробка');
  assert.equal((html.match(/selected/g) ?? []).length, 1);
  assert.match(html, /^<option value="any" selected>Любая коробка<\/option>/);
});

test('подписи опций экранируются', () => {
  const html = filterOptionsHtml(['x'], { x: '<b>Класс</b>' }, 'Любой & всякий');
  assert.ok(!html.includes('<b>Класс</b>'), 'подпись вставлена как разметка');
  assert.match(html, /&lt;b&gt;Класс&lt;\/b&gt;/);
  assert.match(html, /Любой &amp; всякий/);
});

test('счётчик показывает, сколько машин отобрано из общего числа', () => {
  assert.equal(countLabel(2, 8), 'Показано 2 из 8');
  assert.equal(countLabel(8, 8), 'Показано 8 из 8');
  assert.equal(countLabel(0, 8), 'Показано 0 из 8');
});

test('сообщение о пустом результате совпадает с требованиями', () => {
  assert.equal(
    EMPTY_MESSAGE,
    'Под эти условия машин нет — выберите «Любой класс» или «Любая коробка»',
  );
});
