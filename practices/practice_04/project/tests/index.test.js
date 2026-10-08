import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const SECTIONS = ['hero', 'fleet', 'benefits', 'how', 'faq', 'contacts'];

test('на странице ровно один h1', () => {
  const found = html.match(/<h1[\s>]/g) ?? [];
  assert.equal(found.length, 1);
});

test('страница объявляет русский язык, utf-8 и viewport', () => {
  assert.match(html, /<html[^>]+lang="ru"/);
  assert.match(html, /<meta[^>]+charset="utf-8"/i);
  assert.match(html, /<meta[^>]+name="viewport"[^>]+width=device-width/);
});

test('все секции требований присутствуют и идут по порядку', () => {
  let cursor = -1;
  for (const id of SECTIONS) {
    const at = html.indexOf(`id="${id}"`);
    assert.ok(at > -1, `нет секции #${id}`);
    assert.ok(at > cursor, `секция #${id} стоит не по порядку`);
    cursor = at;
  }
});

test('каждая внутренняя ссылка ведёт на существующий id', () => {
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(anchors.length >= SECTIONS.length, 'меню не покрывает секции');
  for (const anchor of new Set(anchors)) {
    assert.ok(html.includes(`id="${anchor}"`), `ссылка #${anchor} ведёт в пустоту`);
  }
});

test('меню содержит якоря на все секции ниже шапки', () => {
  const nav = html.match(/<nav[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav, 'нет меню в шапке');
  for (const id of SECTIONS.filter((id) => id !== 'hero')) {
    assert.ok(nav.includes(`href="#${id}"`), `в меню нет ссылки на #${id}`);
  }
});

test('нет внешних ресурсов', () => {
  const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(external, []);
});

test('в FAQ ровно четыре вопроса на details/summary', () => {
  const faq = html.slice(html.indexOf('id="faq"'), html.indexOf('id="contacts"'));
  assert.equal((faq.match(/<details/g) ?? []).length, 4);
  assert.equal((faq.match(/<summary/g) ?? []).length, 4);
});

test('как арендовать — ровно три шага', () => {
  const how = html.slice(html.indexOf('id="how"'), html.indexOf('id="faq"'));
  assert.equal((how.match(/<li[\s>]/g) ?? []).length, 3);
});

test('преимуществ от трёх до четырёх', () => {
  const benefits = html.slice(html.indexOf('id="benefits"'), html.indexOf('id="how"'));
  const items = (benefits.match(/<li[\s>]/g) ?? []).length;
  assert.ok(items >= 3 && items <= 4, `преимуществ ${items}`);
});

test('контакты — только заглушки из AGENTS.md', () => {
  const contacts = html.slice(html.indexOf('id="contacts"'));
  assert.ok(contacts.includes('+7 000 000-00-00'));
  assert.ok(contacts.includes('hello@example.com'));
});

test('каждый svg либо подписан, либо скрыт от скринридера', () => {
  const svgs = html.match(/<svg[^>]*>/g) ?? [];
  assert.ok(svgs.length > 0, 'на странице нет inline svg');
  for (const svg of svgs) {
    const described = /aria-label="/.test(svg) || /aria-hidden="true"/.test(svg);
    assert.ok(described, `svg без описания: ${svg}`);
  }
});

test('автопарк строится скриптом из src/cars.js', () => {
  assert.match(html, /<script[^>]+type="module"[^>]+src="(\.\/)?src\/main\.js"/);
  assert.ok(!html.includes('data-car-id'), 'строки автопарка захардкожены в разметке');
});
