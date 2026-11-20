import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (relative) => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const html = read('web/index.html');
const app = read('web/src/App.tsx');

const SECTION_COMPONENTS = [
  'HeroSection',
  'FleetSection',
  'CalculatorSection',
  'BookingSection',
  'BenefitsSection',
  'HowSection',
  'FaqSection',
];

test('HTML-оболочка v2: ru, utf-8, viewport, root и module entry', () => {
  assert.equal((html.match(/<html[\s>]/g) ?? []).length, 1);
  assert.match(html, /<html[^>]+lang="ru"/);
  assert.match(html, /<meta[^>]+charset="UTF-8"/i);
  assert.match(html, /<meta[^>]+name="viewport"[^>]+width=device-width/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /<script type="module" src="\/src\/main\.tsx"><\/script>/);
});

test('HTML-оболочка содержит favicon data: и текстовый no-JS fallback', () => {
  assert.match(html, /<link rel="icon" href="data:," \/>/);
  assert.match(html, /<noscript>[\s\S]*Для работы страницы нужен включённый JavaScript\.[\s\S]*<\/noscript>/);
});

test('в HTML-оболочке нет внешних ресурсов', () => {
  const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]*)"/g)].map((match) => match[1]);
  assert.deepEqual(external, []);
});

test('App монтирует провайдер, header/main/footer и секции в контрактном порядке', () => {
  assert.ok(app.indexOf('<AppProvider>') < app.indexOf('<SiteHeader />'));
  assert.ok(app.indexOf('<SiteHeader />') < app.indexOf('<main>'));
  assert.ok(app.indexOf('</main>') < app.indexOf('<SiteFooter />'));

  let cursor = -1;
  for (const component of SECTION_COMPONENTS) {
    const at = app.indexOf(`<${component} />`);
    assert.ok(at > cursor, `${component} отсутствует или стоит не по порядку`);
    cursor = at;
  }
});

test('legacy-страница удалена, чистые модули сохранены', () => {
  for (const file of ['index.html', 'styles.css', 'src/main.js', 'src/render.js']) {
    assert.equal(existsSync(new URL(`../${file}`, import.meta.url)), false, `${file} ещё существует`);
  }
  for (const file of [
    'src/cars.js',
    'src/calc.js',
    'src/filter.js',
    'src/format.js',
    'src/booking.js',
    'src/booking-form.js',
    'src/booking-text.js',
    'src/booking-store.js',
  ]) {
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `${file} потерян`);
  }
});

test('React-секции импортируют общую логику через @legacy', () => {
  const consumers = [
    ['web/src/sections/fleet/FleetSection.tsx', ['@legacy/cars.js', '@legacy/filter.js', '@legacy/format.js']],
    ['web/src/sections/calculator/CalculatorSection.tsx', ['@legacy/calc.js', '@legacy/cars.js']],
    ['web/src/sections/booking/useBookingMachine.ts', ['@legacy/booking.js', '@legacy/booking-form.js']],
    ['web/src/components/Receipt.tsx', ['@legacy/calc.js', '@legacy/format.js']],
  ];
  for (const [file, imports] of consumers) {
    const source = read(file);
    for (const specifier of imports) {
      assert.ok(source.includes(`from '${specifier}'`), `${file} не импортирует ${specifier}`);
    }
  }
});
