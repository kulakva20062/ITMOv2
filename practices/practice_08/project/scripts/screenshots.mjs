// Скриншоты основного сценария и состояний v2 для отчёта (docs/screenshots/).
// Собирает web/dist, поднимает createBookingServer на порту 8321 с чистым хранилищем
// и снимает ключевые экраны React-приложения в реальном Chromium. Ответы медленного/
// сломанного сервера подменяются через route телами в форматах реального API — как в
// tests/e2e. Все кадры — при prefers-reduced-motion: reduce, поэтому hero, штамп и
// hover-glow детерминированы (финальные кадры §3 контракта).
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createBookingServer } from '../server.js';
import { fulfillJson, futureDate, internalErrorBody, successBody } from '../tests/e2e/helpers.mjs';

const BASE = 'http://127.0.0.1:8321';
const OUT = new URL('../docs/screenshots/', import.meta.url);

// Корень и /ui отдают только собранный web/dist — пересобираем его перед съёмкой.
execSync('npm run web:build', { stdio: 'inherit' });

function chromiumPath() {
  for (const c of ['chromium', 'chromium-browser', 'google-chrome']) {
    try {
      return execSync(`command -v ${c}`, { encoding: 'utf8' }).trim();
    } catch {}
  }
  return undefined;
}

// Дата поездки вычисляется от текущих UTC-суток, а не зашита (та же логика, что в тестах).
const START_DATE = futureDate(90);
const DRAFT = { name: 'Алекс Примеров', phone: '+7 000 123-45-67', startDate: START_DATE };

await mkdir(OUT, { recursive: true });

const server = createBookingServer();
await new Promise((resolve) => server.listen(8321, '127.0.0.1', resolve));

const browser = await chromium.launch({ executablePath: chromiumPath(), chromiumSandbox: false });

const staticFrame = { animations: 'disabled' };

async function shot(page, name, clipSelector) {
  const target = clipSelector ? page.locator(clipSelector) : page;
  await target.screenshot({ path: new URL(name, OUT).pathname, ...staticFrame });
  console.log(name);
}

async function open({ width = 1280, height = 900 } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
    locale: 'ru-RU',
    timezoneId: 'UTC',
    colorScheme: 'light',
  });
  return context.newPage();
}

async function estimate(page, { car = 'korda-mini', days = '7', extras = [] } = {}) {
  await page.goto(`${BASE}/`);
  await page.selectOption('#calc-car', car);
  await page.fill('#calc-days', days);
  for (const option of extras) {
    await page.locator(`#calc-extras input[value="${option}"]`).check();
  }
  await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();
  await page.locator('#booking-form[data-state="editing"]').waitFor();
}

async function fillDraft(page) {
  await page.fill('#booking-name', DRAFT.name);
  await page.fill('#booking-phone', DRAFT.phone);
  await page.fill('#booking-date', DRAFT.startDate);
}

// 1. Hero: тёмная blueprint-сцена в финальном кадре stroke-draw/reveal.
let page = await open();
await page.goto(`${BASE}/`);
await page.locator('#hero').scrollIntoViewIfNeeded();
await shot(page, '01-hero-final.png', '#hero');

// 2. Автопарк: выбранная карточка — рамка --ink + обводка --signal, hover-glow.
await page.locator('[data-car-id="prima-sedan"] [data-calc-for]').click();
await page.locator('[data-car-id="prima-sedan"]').hover();
await page.locator('#fleet').scrollIntoViewIfNeeded();
await shot(page, '02-fleet-chosen.png', '#fleet');

// 3. Фильтр без совпадений — пустое состояние.
await page.selectOption('#fleet-filter-class', 'business');
await page.selectOption('#fleet-filter-gearbox', 'manual');
await shot(page, '03-fleet-empty-filter.png', '#fleet');

// 4. Результат расчёта: чек со скидкой, опциями, страховкой и залогом.
await page.selectOption('#fleet-filter-class', { label: 'Любой класс' });
await page.selectOption('#fleet-filter-gearbox', { label: 'Любая коробка' });
await estimate(page, { car: 'nordkap-4x4', days: '14', extras: ['child-seat', 'full-insurance'] });
await page.locator('#calculator').scrollIntoViewIfNeeded();
await shot(page, '04-calculator-result.png', '#calculator');

// 5. Заявка без расчёта — пустое состояние, поля реально disabled.
await page.goto(`${BASE}/`);
await page.locator('#booking').scrollIntoViewIfNeeded();
await shot(page, '05-booking-no-estimate.png', '#booking');

// 6. Ошибки валидации обязательных полей (shake отключён reduced-motion).
await estimate(page);
await page.locator('#booking-submit').click();
await page.locator('#booking-name-error').waitFor();
await shot(page, '06-booking-validation.png', '#booking');

// 7. Отправка: задержка ответа, спиннер, aria-busy и блокировка полей.
await fillDraft(page);
let releaseResponse;
const responseGate = new Promise((resolve) => {
  releaseResponse = resolve;
});
await page.route('**/api/bookings', async (route) => {
  await responseGate;
  await fulfillJson(route, 201, successBody(route.request().postDataJSON()));
});
await page.locator('#booking-submit').click();
await page.locator('#booking-form[data-state="submitting"]').waitFor();
await page.locator('#booking-spinner').waitFor();
await shot(page, '07-booking-submitting.png', '#booking');

// 8. Успех: штамп «Заявка принята» с номером AD-… и чек подтверждения.
releaseResponse();
await page.locator('#booking-form[data-state="success"]').waitFor();
await page.locator('.success-stamp').waitFor();
await shot(page, '08-booking-success-stamp.png', '#booking');

// 9. Ошибка сервера: «сервер недоступен», черновик сохранён, повтор разрешён.
await page.route('**/api/bookings', (route) => fulfillJson(route, 500, internalErrorBody()));
await page.goto(`${BASE}/`);
await estimate(page);
await fillDraft(page);
await page.locator('#booking-submit').click();
await page.locator('#booking-form[data-state="unavailable"]').waitFor();
await shot(page, '09-booking-error.png', '#booking');

// 10. Узкий экран 360px: вся страница читается, элементы доступны, скролла нет.
page = await open({ width: 360, height: 740 });
await estimate(page);
await fillDraft(page);
await page.locator('#booking').scrollIntoViewIfNeeded();
await shot(page, '10-mobile-360.png');

await browser.close();
server.close();
console.log('готово');
