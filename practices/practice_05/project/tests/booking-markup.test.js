import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Срез секции заявки: от её id до следующей секции.
const section = () => html.slice(html.indexOf('id="booking"'), html.indexOf('id="benefits"'));

const FIELDS = ['booking-name', 'booking-phone', 'booking-date'];

test('секция заявки стоит между калькулятором и условиями', () => {
  const calculator = html.indexOf('id="calculator"');
  const booking = html.indexOf('id="booking"');
  const benefits = html.indexOf('id="benefits"');

  assert.ok(calculator > -1 && booking > -1 && benefits > -1);
  assert.ok(calculator < booking, 'заявка стоит раньше калькулятора');
  assert.ok(booking < benefits, 'заявка стоит после условий');
});

test('в меню есть ссылка на заявку', () => {
  const nav = html.match(/<nav[\s\S]*?<\/nav>/)?.[0];

  assert.ok(nav, 'нет меню в шапке');
  assert.ok(nav.includes('href="#booking"'), 'в меню нет ссылки на #booking');
});

test('форма заявки отключает встроенную проверку браузера', () => {
  const form = section().match(/<form[^>]*id="booking-form"[^>]*>/)?.[0];

  assert.ok(form, 'нет формы заявки');
  assert.match(form, /novalidate/, 'форма без novalidate — браузер покажет свои тексты');
});

test('форма несёт машиночитаемое состояние и начинает с «нет расчёта»', () => {
  const form = section().match(/<form[^>]*id="booking-form"[^>]*>/)?.[0];

  assert.match(form, /data-state="no-estimate"/);
});

test('у каждого поля заявки есть подпись через label for', () => {
  const booking = section();

  for (const id of FIELDS) {
    assert.ok(booking.includes(`for="${id}"`), `поле ${id} без label`);
  }
});

test('все три поля присутствуют и обязательны', () => {
  const booking = section();

  for (const id of FIELDS) {
    const field = booking.match(new RegExp(`<input[^>]*id="${id}"[\\s\\S]*?/>`))?.[0];
    assert.ok(field, `нет поля ${id}`);
    assert.match(field, /required/, `поле ${id} не помечено обязательным`);
  }
});

test('дата вводится полем type="date" — значение сразу в формате контракта', () => {
  const field = section().match(/<input[^>]*id="booking-date"[\s\S]*?\/>/)?.[0];

  assert.match(field, /type="date"/);
});

test('горизонт и сегодняшняя дата не прошиты в разметку', () => {
  const field = section().match(/<input[^>]*id="booking-date"[\s\S]*?\/>/)?.[0];

  assert.ok(!/min="\d/.test(field), 'min прошит в разметке, а должен ставиться скриптом');
  assert.ok(!/max="\d/.test(field), 'max прошит в разметке, а должен ставиться скриптом');
  assert.ok(!section().includes('365'), 'горизонт прошит в разметку строкой');
});

test('ошибка каждого поля объявлена как role="alert"', () => {
  const booking = section();

  for (const id of FIELDS) {
    const area = booking.match(new RegExp(`<[^>]*id="${id}-error"[^>]*>`))?.[0];
    assert.ok(area, `нет области ошибки для ${id}`);
    assert.match(area, /role="alert"/, `область ошибки ${id} без role="alert"`);
  }
});

test('область состояния формы — role="status"', () => {
  const area = section().match(/<[^>]*id="booking-status"[^>]*>/)?.[0];

  assert.ok(area, 'нет области состояния');
  assert.match(area, /role="status"/);
});

test('каждое поле связано и с подсказкой, и со своей ошибкой', () => {
  const booking = section();

  for (const id of FIELDS) {
    const field = booking.match(new RegExp(`<input[^>]*id="${id}"[\\s\\S]*?/>`))?.[0];
    const describedBy = field.match(/aria-describedby="([^"]+)"/)?.[1];

    assert.ok(describedBy, `у поля ${id} нет aria-describedby`);

    const ids = describedBy.split(/\s+/);
    assert.ok(ids.includes(`${id}-hint`), `поле ${id} не связано с подсказкой`);
    assert.ok(ids.includes(`${id}-error`), `поле ${id} не связано со своей ошибкой`);

    for (const target of ids) {
      assert.ok(html.includes(`id="${target}"`), `aria-describedby ведёт в пустоту: ${target}`);
    }
  }
});

test('области состояния, общего сообщения и ошибок присутствуют постоянно и пусты', () => {
  const booking = section();
  const live = [
    'booking-status',
    'booking-message',
    'booking-name-error',
    'booking-phone-error',
    'booking-date-error',
  ];

  for (const id of live) {
    const node = booking.match(new RegExp(`<([a-z]+)[^>]*id="${id}"[^>]*>([\\s\\S]*?)</\\1>`));
    assert.ok(node, `нет узла ${id}`);
    assert.equal(node[2].trim(), '', `узел ${id} не пуст в разметке`);
  }
});

test('кнопка отправки — submit внутри формы', () => {
  const button = section().match(/<button[^>]*id="booking-submit"[^>]*>/)?.[0];

  assert.ok(button, 'нет кнопки отправки');
  assert.match(button, /type="submit"/);
});

test('ошибка поля стоит рядом со своим полем, до кнопки отправки', () => {
  const booking = section();
  const submit = booking.indexOf('id="booking-submit"');

  for (const id of FIELDS) {
    const field = booking.indexOf(`id="${id}"`);
    const error = booking.indexOf(`id="${id}-error"`);

    assert.ok(error > field, `ошибка ${id} стоит раньше поля`);
    assert.ok(error < submit, `ошибка ${id} оторвана от поля — она ниже кнопки`);

    // Между полем и его ошибкой не должно быть другого поля ввода.
    assert.ok(
      !/<(input|select)[\s>]/.test(booking.slice(field, error)),
      `между полем ${id} и его ошибкой есть другое поле`,
    );
  }
});

test('порядок полей — имя, телефон, дата: он же порядок обхода клавиатурой', () => {
  const booking = section();
  const positions = FIELDS.map((id) => booking.indexOf(`id="${id}"`));

  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'поля идут не по порядку');
});

test('видимые строки формы в разметке не дублируются — их ставит src/booking-text.js', () => {
  const booking = section();
  const injected = [
    'booking-rail',
    'booking-heading',
    'booking-note',
    'booking-name-label',
    'booking-phone-label',
    'booking-date-label',
    'booking-name-hint',
    'booking-phone-hint',
    'booking-date-hint',
    'booking-submit',
    'booking-empty-text',
    'booking-empty-link',
    'booking-required',
  ];

  for (const id of injected) {
    const node = booking.match(new RegExp(`<([a-z0-9]+)[^>]*id="${id}"[^>]*>([\\s\\S]*?)</\\1>`));
    assert.ok(node, `нет узла ${id}`);
    assert.equal(node[2].trim(), '', `строка узла ${id} продублирована в разметке`);
  }
});

test('без JavaScript секция сообщает, что заявку отправить нельзя', () => {
  const booking = section();

  assert.match(booking, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
});

test('в секции заявки нет внешних ресурсов и data-car-id', () => {
  const booking = section();

  assert.deepEqual([...booking.matchAll(/(?:src|href)="(https?:\/\/[^"]*)"/g)].map((m) => m[1]), []);
  assert.ok(!booking.includes('data-car-id'), 'data-car-id сломает тест автопарка');
});

test('ссылка на калькулятор из секции заявки ведёт на существующий id', () => {
  const booking = section();
  const link = booking.match(/<a[^>]*id="booking-empty-link"[^>]*>/)?.[0];

  assert.ok(link, 'нет ссылки на калькулятор');
  assert.match(link, /href="#calculator"/);
});
