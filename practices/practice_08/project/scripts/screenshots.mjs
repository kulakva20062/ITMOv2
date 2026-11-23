// Скриншоты основного сценария и состояний v2 для отчёта (docs/screenshots/).
// Собирает web/dist, поднимает createBookingServer на порту 8321 с чистым хранилищем
// и снимает ключевые экраны React-приложения в реальном Chromium. Запрос при съёмке
// загрузки задерживается и доходит до API. Ошибка 500 подменяется через route.
// Все кадры — при prefers-reduced-motion: reduce, поэтому hero, штамп и
// hover-glow детерминированы (финальные кадры §3 контракта).
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createBookingServer } from '../server.js';
import { fillDraft, fulfillJson, futureDate, internalErrorBody, makeEstimate } from '../tests/e2e/helpers.mjs';
import { chromiumLaunchOptions } from './chromium.mjs';

const BASE = 'http://127.0.0.1:8321';
const OUT = new URL('../docs/screenshots/', import.meta.url);

// Корень и /ui отдают только собранный web/dist — пересобираем его перед съёмкой.
execSync('npm run web:build', { stdio: 'inherit' });

// Те же машина, срок и опции, что на экранах макета.
const ESTIMATE = { carId: 'korda-mini', days: 7, extras: ['extra-driver', 'full-insurance'] };
// Дата поездки вычисляется от текущих UTC-суток, а не зашита (та же логика, что в тестах).
const START_DATE = futureDate(90);
const DRAFT = { name: 'Алекс Примеров', phone: '+7 000 123-45-67', startDate: START_DATE };

await mkdir(OUT, { recursive: true });

const server = createBookingServer();
await new Promise((resolve) => server.listen(8321, '127.0.0.1', resolve));

const browser = await chromium.launch(chromiumLaunchOptions);

const staticFrame = { animations: 'disabled' };

async function shot(page, name, clipSelector) {
  const target = clipSelector ? page.locator(clipSelector) : page;
  await target.screenshot({ path: new URL(name, OUT).pathname, ...staticFrame });
  console.log(name);
}

async function open({ width = 1280, height = 900 } = {}) {
  const context = await browser.newContext({
    baseURL: BASE,
    viewport: { width, height },
    reducedMotion: 'reduce',
    locale: 'ru-RU',
    timezoneId: 'UTC',
    colorScheme: 'light',
  });
  return context.newPage();
}

// 1. Hero: тёмная blueprint-сцена в финальном кадре stroke-draw/reveal.
const page = await open();
await page.goto('/');
await page.locator('#hero').scrollIntoViewIfNeeded();
await shot(page, '01-hero-final.png', '#hero');

// 2. Автопарк: выбранная карточка — рамка --ink + обводка --signal, hover-glow.
const car = page.locator(`[data-car-id="${ESTIMATE.carId}"]`);
await car.locator('[data-calc-for]').click();
await car.hover();
await page.locator('#fleet').scrollIntoViewIfNeeded();
await shot(page, '02-fleet-chosen.png', '#fleet');

// 3. Фильтр без совпадений — пустое состояние.
await page.selectOption('#fleet-filter-class', 'business');
await page.selectOption('#fleet-filter-gearbox', 'manual');
await shot(page, '03-fleet-empty-filter.png', '#fleet');

// 4. Результат расчёта: чек со скидкой, опциями, страховкой и залогом.
await makeEstimate(page, ESTIMATE);
await page.locator('#calculator').scrollIntoViewIfNeeded();
await shot(page, '04-calculator-result.png', '#calculator');

// 5. Заявка без расчёта — пустое состояние, поля реально disabled.
await page.goto('/');
await page.locator('#booking').scrollIntoViewIfNeeded();
await shot(page, '05-booking-no-estimate.png', '#booking');

// 6. Как в макете: пустое имя, короткий телефон и пустая дата.
await makeEstimate(page, ESTIMATE);
await page.locator('#booking-phone').fill('123');
await page.locator('#booking-submit').click();
await page.locator('#booking-name-error').waitFor();
await shot(page, '06-booking-validation.png', '#booking');

// 7. Отправка: задержка ответа, спиннер, aria-busy и блокировка полей.
await fillDraft(page, DRAFT);
let releaseResponse;
const responseGate = new Promise((resolve) => {
  releaseResponse = resolve;
});
const bookings = '**/api/bookings';
await page.route(bookings, async (route) => {
  await responseGate;
  await route.continue();
});
await page.locator('#booking-submit').click();
await page.locator('#booking-form[data-state="submitting"]').waitFor();
await page.locator('#booking-spinner').waitFor();
await shot(page, '07-booking-submitting.png', '#booking');

// 8. Успех: штамп «Заявка принята» с номером AD-… и чек подтверждения.
releaseResponse();
await page.locator('#booking-form[data-state="success"]').waitFor();
await page.locator('.success-stamp').waitFor();
await page.mouse.move(0, 0);
await shot(page, '08-booking-success-stamp.png', '#booking');
await page.unroute(bookings);

// 9. Ошибка сервера: «сервер недоступен», черновик сохранён, повтор разрешён.
await page.route(bookings, (route) => fulfillJson(route, 500, internalErrorBody()));
await makeEstimate(page, ESTIMATE);
await fillDraft(page, DRAFT);
await page.locator('#booking-submit').click();
await page.locator('#booking-form[data-state="unavailable"]').waitFor();
await shot(page, '09-booking-error.png', '#booking');
await page.unroute(bookings);

// 10. Узкий экран 360px: вся страница читается, элементы доступны, скролла нет.
const mobile = await open({ width: 360, height: 740 });
await makeEstimate(mobile, ESTIMATE);
await fillDraft(mobile, DRAFT);
await mobile.locator('#booking-name').focus();
await shot(mobile, '10-mobile-360.png', '#booking');

// 11. Пересечение с бронью из шага 8 возвращает реальный 409.
await makeEstimate(page, ESTIMATE);
await fillDraft(page, { ...DRAFT, name: 'Ирина Примерова' });
await page.locator('#booking-submit').click();
await page.locator('#booking-date-error').waitFor();
await shot(page, '11-booking-conflict.png', '#booking');

await browser.close();
server.close();
console.log('готово');
