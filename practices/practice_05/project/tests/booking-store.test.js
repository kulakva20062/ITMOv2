import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, store } from '../src/booking-store.js';

const NOW = '2026-10-23T12:00:00.000Z';

const PRICE = Object.freeze({
  base: 7200,
  discount: 0,
  extrasTotal: 0,
  insurance: 0,
  total: 7200,
  deposit: 10000,
});

function draft(overrides = {}) {
  return {
    carId: 'larus-16',
    days: 3,
    extras: [],
    name: 'Иван Петров',
    phone: '+70000000000',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
    price: PRICE,
    ...overrides,
  };
}

function keyOf(overrides = {}) {
  const value = draft(overrides);
  return {
    carId: value.carId,
    startDate: value.startDate,
    days: value.days,
    extras: value.extras,
    name: value.name,
    phone: value.phone,
  };
}

test('add выдаёт номера последовательно с ведущими нулями', () => {
  const local = createStore();

  assert.equal(local.add(draft(), NOW).id, 'AD-0001');
  assert.equal(local.add(draft({ startDate: '2026-12-01' }), NOW).id, 'AD-0002');
});

test('номер остаётся читаемым на десятой и десятитысячной заявке', () => {
  const local = createStore();

  for (let index = 1; index < 10; index += 1) {
    local.add(draft(), NOW);
  }
  assert.equal(local.add(draft(), NOW).id, 'AD-0010');

  for (let index = 11; index < 10000; index += 1) {
    local.add(draft(), NOW);
  }
  assert.equal(local.add(draft(), NOW).id, 'AD-10000', 'формат не ломается за пределами 4 цифр');
});

test('add собирает запись по форме ответа 201', () => {
  const local = createStore();
  const booking = local.add(draft({ extras: ['child-seat'] }), NOW);

  assert.deepEqual(booking, {
    id: 'AD-0001',
    status: 'confirmed',
    carId: 'larus-16',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
    days: 3,
    extras: ['child-seat'],
    customer: { name: 'Иван Петров', phone: '+70000000000' },
    price: PRICE,
    createdAt: NOW,
  });
});

test('запись не делит ссылки с переданной заготовкой', () => {
  const local = createStore();
  const source = draft({ extras: ['child-seat'] });
  const booking = local.add(source, NOW);

  source.extras.push('extra-driver');
  assert.deepEqual(booking.extras, ['child-seat'], 'опции скопированы');
  assert.notEqual(booking.price, source.price, 'цена скопирована');
});

test('findById находит заявку и молчит о неизвестном номере', () => {
  const local = createStore();
  const booking = local.add(draft(), NOW);

  assert.equal(local.findById('AD-0001'), booking);
  assert.equal(local.findById('AD-9999'), undefined);
});

test('findSame узнаёт заявку при другом порядке опций', () => {
  const local = createStore();
  const booking = local.add(draft({ extras: ['child-seat', 'full-insurance'] }), NOW);

  assert.equal(local.findSame(keyOf({ extras: ['full-insurance', 'child-seat'] })), booking);
});

test('findSame различает заявки по каждому полю ключа', () => {
  const local = createStore();
  local.add(draft(), NOW);

  assert.equal(local.findSame(keyOf()), local.findById('AD-0001'), 'полное совпадение');
  assert.equal(local.findSame(keyOf({ days: 4 })), undefined, 'другой срок');
  assert.equal(local.findSame(keyOf({ carId: 'prima-sedan' })), undefined, 'другая машина');
  assert.equal(local.findSame(keyOf({ startDate: '2026-11-11' })), undefined, 'другая дата');
  assert.equal(local.findSame(keyOf({ name: 'Анна Смирнова' })), undefined, 'другое имя');
  assert.equal(local.findSame(keyOf({ phone: '+70000000001' })), undefined, 'другой телефон');
  assert.equal(local.findSame(keyOf({ extras: ['child-seat'] })), undefined, 'другие опции');
});

test('intervalsFor отдаёт интервалы одной машины по возрастанию даты', () => {
  const local = createStore();
  local.add(draft({ startDate: '2026-12-01', endDate: '2026-12-03' }), NOW);
  local.add(draft({ startDate: '2026-11-10', endDate: '2026-11-13' }), NOW);
  local.add(draft({ carId: 'prima-sedan', startDate: '2026-11-20', endDate: '2026-11-22' }), NOW);

  assert.deepEqual(local.intervalsFor('larus-16'), [
    { startDate: '2026-11-10', endDate: '2026-11-13' },
    { startDate: '2026-12-01', endDate: '2026-12-03' },
  ]);
  assert.deepEqual(local.intervalsFor('prima-sedan'), [
    { startDate: '2026-11-20', endDate: '2026-11-22' },
  ]);
  assert.deepEqual(local.intervalsFor('taiga-lift'), [], 'свободная машина — пустой список');
});

test('intervalsFor даёт серверу материал для поиска первого пересечения', () => {
  const local = createStore();
  local.add(draft({ startDate: '2026-11-20', endDate: '2026-11-22' }), NOW);
  local.add(draft({ startDate: '2026-11-10', endDate: '2026-11-13' }), NOW);

  // Порядок по startDate — то, на чём держится правило «первый по startDate» в поле conflict.
  assert.deepEqual(local.intervalsFor('larus-16')[0], {
    startDate: '2026-11-10',
    endDate: '2026-11-13',
  });
});

test('clear возвращает хранилище к состоянию после старта процесса', () => {
  const local = createStore();
  local.add(draft(), NOW);
  local.add(draft(), NOW);

  local.clear();

  assert.deepEqual(local.intervalsFor('larus-16'), []);
  assert.equal(local.findById('AD-0001'), undefined);
  assert.equal(local.add(draft(), NOW).id, 'AD-0001', 'нумерация снова с первой заявки');
});

test('два хранилища не делят состояние', () => {
  const first = createStore();
  const second = createStore();

  first.add(draft(), NOW);

  assert.equal(first.intervalsFor('larus-16').length, 1);
  assert.deepEqual(second.intervalsFor('larus-16'), []);
  assert.equal(second.findById('AD-0001'), undefined);
});

test('модуль отдаёт общий экземпляр для процесса сервера', () => {
  assert.equal(typeof store.add, 'function');
  assert.equal(typeof store.clear, 'function');
  assert.notEqual(store, createStore());
});
