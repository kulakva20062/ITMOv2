import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cars, CAR_CLASSES, GEARBOXES } from '../src/cars.js';

test('в автопарке не меньше 6 машин', () => {
  assert.ok(Array.isArray(cars));
  assert.ok(cars.length >= 6, `машин всего ${cars.length}`);
});

test('идентификаторы машин уникальны и непусты', () => {
  const ids = cars.map((car) => car.id);
  for (const id of ids) {
    assert.equal(typeof id, 'string');
    assert.ok(id.length > 0);
  }
  assert.equal(new Set(ids).size, ids.length);
});

test('у каждой машины заполнены все поля контракта', () => {
  for (const car of cars) {
    assert.equal(typeof car.model, 'string', `модель у ${car.id}`);
    assert.ok(car.model.trim().length > 0, `модель у ${car.id} пуста`);
    assert.ok(CAR_CLASSES.includes(car.class), `класс ${car.class} у ${car.id}`);
    assert.ok(GEARBOXES.includes(car.gearbox), `коробка ${car.gearbox} у ${car.id}`);
    assert.ok(Number.isInteger(car.seats), `места у ${car.id} не целое`);
    assert.ok(car.seats >= 2 && car.seats <= 9, `места у ${car.id} вне 2..9`);
    assert.ok(Number.isInteger(car.pricePerDay), `цена у ${car.id} не целая`);
    assert.ok(car.pricePerDay > 0, `цена у ${car.id} не положительная`);
  }
});

test('классы автопарка перечислены по контракту требований', () => {
  assert.deepEqual([...CAR_CLASSES], ['economy', 'comfort', 'business', 'suv']);
});

test('в автопарке есть машина каждого класса', () => {
  for (const carClass of CAR_CLASSES) {
    assert.ok(
      cars.some((car) => car.class === carClass),
      `нет машины класса ${carClass}`,
    );
  }
});
