import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBookingServer } from '../server.js';
import { createStore } from '../src/booking-store.js';
import { calculateRental } from '../src/calc.js';

// Фиксированные часы: таблицы граничных значений спеки привязаны к этой дате.
const TODAY = '2026-10-23';
const NOW = '2026-10-23T12:00:00.000Z';

// Поднимает сервер на свободном порту: занятый 8000 тестам не мешает (research.md R-01).
// Соединения закрываются принудительно, иначе keep-alive держит процесс node --test.
async function start(t, options = {}) {
  const store = options.store ?? createStore();
  const server = createBookingServer({
    store,
    today: () => options.today ?? TODAY,
    now: () => options.now ?? NOW,
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });

  const base = `http://127.0.0.1:${server.address().port}`;

  // Отправляет заявку так, как это делает UI: JSON-тело и обязательный Content-Type.
  const post = (body, init = {}) =>
    fetch(`${base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...init.headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...init,
    });

  return { store, base, post };
}

const VALID = Object.freeze({
  carId: 'larus-16',
  days: 3,
  extras: [],
  name: 'Иван Петров',
  phone: '+7 000 000-00-00',
  startDate: '2026-11-10',
});

function request(overrides = {}) {
  return { ...VALID, ...overrides };
}

test('корректная заявка получает номер, срок и цену от сервера', async (t) => {
  const { post } = await start(t);

  const response = await post(request());
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('location'), '/api/bookings/AD-0001');
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');

  assert.deepEqual(await response.json(), {
    id: 'AD-0001',
    status: 'confirmed',
    carId: 'larus-16',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
    days: 3,
    extras: [],
    customer: { name: 'Иван Петров', phone: '+70000000000' },
    price: {
      base: 7200,
      discount: 0,
      extrasTotal: 0,
      insurance: 0,
      total: 7200,
      deposit: 10000,
    },
    createdAt: NOW,
  });
});

test('опции и страховка попадают в расшифровку цены', async (t) => {
  const { post } = await start(t);

  const response = await post(request({ extras: ['child-seat', 'full-insurance'] }));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.price.extrasTotal, 900);
  assert.equal(body.price.insurance, 1080);
  assert.equal(body.price.total, 9180);
});

test('номера выдаются последовательно', async (t) => {
  const { post } = await start(t);

  assert.equal((await post(request())).headers.get('location'), '/api/bookings/AD-0001');
  const second = await post(request({ carId: 'prima-sedan' }));
  assert.equal((await second.json()).id, 'AD-0002');
});

test('цена в ответе совпадает с расчётом калькулятора', async (t) => {
  const { post } = await start(t);

  const cases = [
    { carId: 'larus-16', days: 3, extras: [] },
    { carId: 'prima-sedan', days: 7, extras: ['child-seat'] },
    { carId: 'nordkap-4x4', days: 14, extras: ['extra-driver', 'full-insurance'] },
  ];

  for (const [index, combo] of cases.entries()) {
    const response = await post(request({ ...combo, startDate: `2027-0${index + 1}-05` }));
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(body.price, calculateRental(combo), `${combo.carId} / ${combo.days} суток`);
  }
});

test('присланные серверные поля и лишние ключи игнорируются', async (t) => {
  const { post } = await start(t);

  const response = await post(
    request({
      total: 1,
      price: { total: 1 },
      endDate: '2030-01-01',
      id: 'AD-9000',
      status: 'cancelled',
      createdAt: '2000-01-01T00:00:00.000Z',
      foo: 'bar',
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.id, 'AD-0001', 'номер присваивает сервер');
  assert.equal(body.status, 'confirmed');
  assert.equal(body.endDate, '2026-11-13', 'дату окончания считает сервер');
  assert.equal(body.createdAt, NOW);
  assert.equal(body.price.total, 7200, 'цену считает сервер');
  assert.equal('foo' in body, false, 'неизвестные поля в ответ не возвращаются');
});

test('опции возвращаются в порядке EXTRA_OPTIONS', async (t) => {
  const { post } = await start(t);

  const response = await post(request({ extras: ['full-insurance', 'child-seat'] }));
  assert.deepEqual((await response.json()).extras, ['child-seat', 'full-insurance']);
});

test('заявку можно прочитать по номеру', async (t) => {
  const { base, post } = await start(t);

  const created = await (await post(request())).json();

  const response = await fetch(`${base}/api/bookings/AD-0001`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null, 'Location при чтении не отправляется');
  assert.deepEqual(await response.json(), created);
});

test('неизвестный номер заявки — booking_not_found', async (t) => {
  const { base } = await start(t);

  const response = await fetch(`${base}/api/bookings/AD-9999`);
  assert.equal(response.status, 404);

  const body = await response.json();
  assert.equal(body.error.code, 'booking_not_found');
  assert.deepEqual(body.error.fields, []);
});

// Заявки US2 отличаются от принятой именем: иначе сработало бы правило повторной отправки (§9).
const OTHER = { name: 'Анна Смирнова' };

test('пересечение дат на одной машине отклоняется', async (t) => {
  // Каждый случай начинается с чистого хранилища, где занято [2026-11-10, 2026-11-13).
  const cases = [
    { startDate: '2026-11-07', days: 3, expected: 201, why: 'встык слева' },
    { startDate: '2026-11-07', days: 4, expected: 409, why: 'заходит слева' },
    { startDate: '2026-11-10', days: 1, expected: 409, why: 'начало совпадает' },
    { startDate: '2026-11-12', days: 2, expected: 409, why: 'заходит справа' },
    { startDate: '2026-11-13', days: 1, expected: 201, why: 'встык справа — день возврата' },
    { startDate: '2026-11-09', days: 10, expected: 409, why: 'накрывает занятое' },
  ];

  for (const { startDate, days, expected, why } of cases) {
    const fresh = await start(t);
    await fresh.post(request());

    const response = await fresh.post(request({ ...OTHER, startDate, days }));
    assert.equal(response.status, expected, `${startDate} +${days}: ${why}`);
  }
});

test('правило пересечения действует в пределах одной машины', async (t) => {
  const { post } = await start(t);
  await post(request());

  const response = await post(request({ ...OTHER, carId: 'prima-sedan' }));
  assert.equal(response.status, 201, 'другая машина на те же даты свободна');
});

test('тело конфликта содержит ISO-границы занятого интервала', async (t) => {
  const { post } = await start(t);
  await post(request());

  const response = await post(request({ ...OTHER, startDate: '2026-11-12', days: 2 }));
  assert.equal(response.status, 409);

  const body = await response.json();
  assert.equal(body.error.code, 'date_conflict');
  assert.deepEqual(body.error.conflict, {
    carId: 'larus-16',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
  });
  assert.deepEqual(body.error.fields, [
    { field: 'startDate', code: 'date_conflict', message: 'Занято с 10.11.2026 по 12.11.2026.' },
  ]);
  assert.match(body.error.message, /с 10\.11\.2026 по 12\.11\.2026/, 'назван последний занятый день');
});

test('конфликт не раскрывает имя и телефон чужой заявки', async (t) => {
  const { post } = await start(t);
  await post(request());

  const response = await post(request({ ...OTHER, startDate: '2026-11-12', days: 2 }));
  const raw = await response.text();

  assert.equal(raw.includes('Иван'), false);
  assert.equal(raw.includes('0000000'), false);
});

test('при нескольких пересечениях назван первый по дате начала', async (t) => {
  const { post } = await start(t);
  await post(request({ startDate: '2026-11-20', days: 2 }));
  await post(request({ startDate: '2026-11-10', days: 3 }));

  const response = await post(request({ ...OTHER, startDate: '2026-11-09', days: 20 }));
  assert.equal(response.status, 409);
  assert.deepEqual((await response.json()).error.conflict, {
    carId: 'larus-16',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
  });
});

test('две одновременные заявки на один интервал: принята ровно одна', async (t) => {
  const { base, post } = await start(t);

  const [first, second] = await Promise.all([
    post(request()),
    post(request({ ...OTHER })),
  ]);

  const codes = [first.status, second.status].sort();
  assert.deepEqual(codes, [201, 409], 'одна принята, вторая получила конфликт');

  const stored = await fetch(`${base}/api/bookings/AD-0001`);
  assert.equal(stored.status, 200);
  assert.equal((await fetch(`${base}/api/bookings/AD-0002`)).status, 404, 'второй записи нет');
});

test('сломанные поля отдаются списком в стабильном порядке', async (t) => {
  const { base, post } = await start(t);

  const response = await post(request({ days: 0, name: 'A', phone: '123' }));
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.error.code, 'validation_failed');
  assert.deepEqual(
    body.error.fields.map((item) => item.field),
    ['days', 'name', 'phone'],
  );
  assert.deepEqual(
    body.error.fields.map((item) => item.code),
    ['days_out_of_range', 'name_length', 'phone_invalid'],
  );
  assert.match(body.error.message, /3 поля заполнены неверно/);

  assert.equal((await fetch(`${base}/api/bookings/AD-0001`)).status, 404, 'хранилище не изменилось');
});

test('отказ не расходует номер заявки', async (t) => {
  const { post } = await start(t);

  await post(request({ days: 0 }));
  await post(request({ phone: '123' }));

  const accepted = await post(request());
  assert.equal((await accepted.json()).id, 'AD-0001', 'первый принятой достаётся первый номер');
});

test('неизвестная машина и прошедшая дата называются по полю', async (t) => {
  const { post } = await start(t);

  const car = await (await post(request({ carId: 'ferrari-f40' }))).json();
  assert.deepEqual(
    car.error.fields.map((item) => [item.field, item.code]),
    [['carId', 'car_unknown']],
  );

  const date = await (await post(request({ startDate: '2026-10-22' }))).json();
  assert.deepEqual(
    date.error.fields.map((item) => [item.field, item.code]),
    [['startDate', 'date_past']],
  );
});

test('нераспознанное тело — invalid_json с пустым списком полей', async (t) => {
  const { post } = await start(t);

  for (const raw of ['', 'не json', '[]', 'null', '"строка"']) {
    const response = await post(raw);
    assert.equal(response.status, 400, `тело ${JSON.stringify(raw)}`);

    const body = await response.json();
    assert.equal(body.error.code, 'invalid_json');
    assert.deepEqual(body.error.fields, []);
  }
});

test('Content-Type обязателен', async (t) => {
  const { base } = await start(t);

  for (const headers of [{}, { 'Content-Type': 'text/plain' }]) {
    const response = await fetch(`${base}/api/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(VALID),
    });

    assert.equal(response.status, 415);
    assert.equal((await response.json()).error.code, 'unsupported_media_type');
  }
});

test('Content-Type с параметром charset принимается', async (t) => {
  const { post } = await start(t);

  const response = await post(request(), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
  assert.equal(response.status, 201);
});

test('тело больше 8 КБ не разбирается', async (t) => {
  const { post } = await start(t);

  const padded = JSON.stringify({ ...VALID, pad: 'x'.repeat(9000) });
  const response = await post(padded);

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'payload_too_large');
});

test('тело ровно на границе 8 КБ принимается', async (t) => {
  const { post } = await start(t);

  const base = JSON.stringify({ ...VALID, pad: '' });
  const padded = JSON.stringify({ ...VALID, pad: 'x'.repeat(8192 - Buffer.byteLength(base)) });
  assert.equal(Buffer.byteLength(padded), 8192);

  assert.equal((await post(padded)).status, 201);
});

test('GET на список заявок — 405 с заголовком Allow', async (t) => {
  const { base } = await start(t);

  const response = await fetch(`${base}/api/bookings`);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});

test('POST на конкретную заявку — 405 с заголовком Allow', async (t) => {
  const { base } = await start(t);

  const response = await fetch(`${base}/api/bookings/AD-0001`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('занятость проверяется после полей: некорректная заявка даёт 400, а не 409', async (t) => {
  const { post } = await start(t);
  await post(request());

  const response = await post(request({ name: 'A', startDate: '2026-11-11' }));
  assert.equal(response.status, 400, 'сначала проверка полей');
  assert.equal((await response.json()).error.code, 'validation_failed');
});

test('у любой ошибки единая форма тела и JSON-тип', async (t) => {
  const { base, post } = await start(t);

  const responses = [
    await post(request({ days: 0 })),
    await post('не json'),
    await fetch(`${base}/api/bookings`, { method: 'POST', body: '{}' }),
    await fetch(`${base}/api/bookings`, { method: 'DELETE' }),
    await fetch(`${base}/api/bookings/AD-9999`),
    await fetch(`${base}/api/unknown`),
  ];

  for (const response of responses) {
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');

    const raw = await response.text();
    assert.equal(raw.includes('<'), false, 'HTML не отдаётся');
    assert.equal(raw.includes('at '), false, 'стектрейс не отдаётся');

    const body = JSON.parse(raw);
    assert.equal(typeof body.error.code, 'string');
    assert.equal(typeof body.error.message, 'string');
    assert.ok(Array.isArray(body.error.fields), 'fields — массив всегда');
  }
});

test('сбой внутри обработчика даёт 500 и не валит процесс', async (t) => {
  const broken = createStore();
  broken.intervalsFor = () => {
    throw new Error('хранилище сломалось');
  };

  const { base, post } = await start(t, { store: broken });

  const response = await post(request());
  assert.equal(response.status, 500);

  const body = await response.json();
  assert.equal(body.error.code, 'internal_error');
  assert.equal(body.error.message.includes('хранилище сломалось'), false, 'без подробностей');

  assert.equal((await fetch(`${base}/`)).status, 200, 'следующий запрос обслужен');
});

test('точный повтор заявки возвращает ту же бронь', async (t) => {
  const { base, post } = await start(t);

  const first = await post(request());
  assert.equal(first.status, 201);

  const second = await post(request());
  assert.equal(second.status, 200, 'повтор, а не новая бронь');
  assert.equal(second.headers.get('location'), null, 'Location при повторе не отправляется');
  assert.deepEqual(await second.json(), await first.json());

  assert.equal((await fetch(`${base}/api/bookings/AD-0002`)).status, 404, 'вторая бронь не создана');
});

test('повтор узнаётся несмотря на порядок опций, пробелы и запись телефона', async (t) => {
  const { post } = await start(t);
  await post(request({ extras: ['child-seat', 'full-insurance'] }));

  const variants = [
    { extras: ['full-insurance', 'child-seat'] },
    { extras: ['child-seat', 'full-insurance'], name: '  Иван Петров  ' },
    { extras: ['child-seat', 'full-insurance'], phone: '80000000000' },
    { extras: ['child-seat', 'full-insurance'], phone: '+7 (000) 000-00-00' },
  ];

  for (const overrides of variants) {
    const response = await post(request(overrides));
    assert.equal(response.status, 200, JSON.stringify(overrides));
    assert.equal((await response.json()).id, 'AD-0001');
  }
});

test('различие хотя бы в одном поле ключа делает заявку новой', async (t) => {
  const { post } = await start(t);
  await post(request());

  const conflicting = await post(request({ name: 'Анна Смирнова' }));
  assert.equal(conflicting.status, 409, 'другое имя — новая заявка, даты заняты');

  const otherDays = await post(request({ days: 4 }));
  assert.equal(otherDays.status, 409, 'другой срок с пересечением');

  const free = await post(request({ days: 2, startDate: '2026-12-01' }));
  assert.equal(free.status, 201, 'другой срок без пересечения');
  assert.equal((await free.json()).id, 'AD-0002');

  const otherCar = await post(request({ carId: 'prima-sedan' }));
  assert.equal(otherCar.status, 201, 'другая машина');
  assert.equal((await otherCar.json()).id, 'AD-0003');
});

test('правило повтора проверяется до правила пересечения', async (t) => {
  const { post } = await start(t);
  await post(request());

  // Интервал повтора пересекается с собственной бронью — это не повод для 409.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await post(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, 'AD-0001');
  }
});

test('повторный отказ по полям остаётся отказом и не расходует номер', async (t) => {
  const { post } = await start(t);

  assert.equal((await post(request({ days: 0 }))).status, 400);
  assert.equal((await post(request({ days: 0 }))).status, 400);

  const accepted = await post(request());
  assert.equal((await accepted.json()).id, 'AD-0001');
});

test('статика и API живут в одном процессе', async (t) => {
  const { base } = await start(t);

  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);

  const styles = await fetch(`${base}/styles.css`);
  assert.equal(styles.status, 200);
  assert.match(styles.headers.get('content-type'), /text\/css/);

  const module = await fetch(`${base}/src/calc.js`);
  assert.equal(module.status, 200);
  assert.match(module.headers.get('content-type'), /javascript/);
});

test('неизвестный путь под /api отдаёт not_found в форме JSON', async (t) => {
  const { base } = await start(t);

  const response = await fetch(`${base}/api/unknown`);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');

  const body = await response.json();
  assert.equal(body.error.code, 'not_found');
  assert.deepEqual(body.error.fields, []);
});

test('ручка занятых дат в v1 не существует', async (t) => {
  const { base } = await start(t);

  const response = await fetch(`${base}/api/cars/larus-16/busy`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'not_found');
});

test('неподдерживаемый метод на известном пути даёт 405 с заголовком Allow', async (t) => {
  const { base } = await start(t);

  const response = await fetch(`${base}/api/bookings`, { method: 'DELETE' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  assert.equal((await response.json()).error.code, 'method_not_allowed');
});

test('статика отдаёт только страницу, стили и модули src/', async (t) => {
  const { base } = await start(t);

  // Внутренние файлы проекта статикой не раздаются, даже находясь в корне.
  for (const target of [
    '/AGENTS.md',
    '/package.json',
    '/docs/requirements.md',
    '/specs/contracts/booking-contract.md',
    '/scripts/check.sh',
  ]) {
    const response = await fetch(`${base}${target}`);
    assert.equal(response.status, 404, `${target} не должен отдаваться`);
  }
});

test('выход за корень проекта не отдаёт файл', async (t) => {
  const { base } = await start(t);

  // fetch нормализует /../ сам, поэтому проверяем и закодированные варианты.
  for (const target of ['/../AGENTS.md', '/..%2fAGENTS.md', '/src/..%2f..%2fAGENTS.md', '/src/%2e%2e/AGENTS.md']) {
    const response = await fetch(`${base}${target}`);
    assert.ok(response.status === 404 || response.status === 400, `${target} -> ${response.status}`);
  }
});

test('несуществующий файл не роняет сервер', async (t) => {
  const { base } = await start(t);

  assert.equal((await fetch(`${base}/nope.css`)).status, 404);
  assert.equal((await fetch(`${base}/`)).status, 200, 'сервер продолжает работать');
});
