import { expect, test } from '@playwright/test';
import { fillDraft, fulfillJson, makeEstimate, successBody } from './helpers.mjs';

test.use({
  reducedMotion: 'reduce',
  viewport: { width: 1280, height: 900 },
  locale: 'ru-RU',
  timezoneId: 'UTC',
  colorScheme: 'light',
});

const staticFrame = { animations: 'disabled' };

test('hero: детерминированный финальный кадр blueprint', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('#hero');
  await expect(hero).toBeVisible();

  const strokes = await hero.locator('.hero__lines path, .hero__lines circle').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).strokeDashoffset),
  );
  expect(strokes).toHaveLength(6);
  for (const offset of strokes) expect(['0', '0px']).toContain(offset);
  await expect(hero.locator('.hero__panel')).toHaveCSS('opacity', '1');
  await expect(hero.locator('.hero__drawing')).toHaveCSS('transform', 'none');
  await expect(hero).toHaveScreenshot('hero-final.png', staticFrame);
});

test('fleet: выбранная карточка в статичном hover-glow', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-car-id="prima-sedan"]');
  await card.locator('[data-calc-for]').click();
  await expect(card).toHaveAttribute('data-chosen', 'true');
  await card.hover();
  await expect(card).toHaveCSS('transform', 'none');
  await expect(card).toHaveScreenshot('fleet-card-chosen-hover.png', staticFrame);
});

test('calculator: чек со скидкой, опцией, страховкой и залогом', async ({ page }) => {
  await makeEstimate(page, {
    carId: 'nordkap-4x4',
    days: 14,
    extras: ['child-seat', 'full-insurance'],
  });
  const receipt = page.locator('#calc-result');
  await expect(receipt.locator('.receipt')).toBeVisible();
  await expect(receipt).toContainText('Скидка за срок, 15 %');
  await expect(receipt).toContainText('Полная страховка');
  await expect(receipt).toHaveScreenshot('calculator-receipt.png', staticFrame);
});

test('booking: валидация всех обязательных полей', async ({ page }) => {
  await makeEstimate(page);
  await page.locator('#booking-submit').click();
  await expect(page.locator('#booking-name-error')).toContainText('Укажите имя');
  await expect(page.locator('#booking-phone-error')).toContainText('Укажите телефон');
  await expect(page.locator('#booking-date-error')).toContainText('Выберите дату');
  await expect(page.locator('#booking-form')).toHaveCSS('transform', 'none');
  await expect(page.locator('#booking-form')).toHaveScreenshot('booking-validation.png', staticFrame);
});

test('booking: submitting со статичным спиннером и aria-busy', async ({ page }) => {
  await makeEstimate(page);
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
  await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'submitting');
  await expect(page.locator('#booking-spinner')).toBeVisible();
  await expect(page.locator('#booking-spinner')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('#booking-submit')).toHaveScreenshot('booking-submitting.png', staticFrame);

  releaseResponse();
  await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'success');
});

test('booking: success-штамп в финальном reduced-motion кадре', async ({ page }) => {
  await makeEstimate(page);
  await fillDraft(page);
  await page.route('**/api/bookings', (route) =>
    fulfillJson(route, 201, successBody(route.request().postDataJSON())),
  );
  await page.locator('#booking-submit').click();

  const stamp = page.locator('.success-stamp');
  await expect(stamp).toContainText('AD-7777');
  await expect(stamp).toHaveCSS('opacity', '1');
  const matrix = await stamp.evaluate((node) => {
    const value = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { a: value.a, b: value.b, c: value.c, d: value.d };
  });
  expect(matrix.a).toBeCloseTo(Math.cos(-3 * Math.PI / 180), 5);
  expect(matrix.b).toBeCloseTo(Math.sin(-3 * Math.PI / 180), 5);
  expect(matrix.c).toBeCloseTo(-Math.sin(-3 * Math.PI / 180), 5);
  expect(matrix.d).toBeCloseTo(Math.cos(-3 * Math.PI / 180), 5);
  await expect(stamp).toHaveScreenshot('booking-success-stamp.png', staticFrame);
});

test('360px: полная страница no-estimate без горизонтального overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page).toHaveScreenshot('mobile-360-no-estimate.png', { ...staticFrame, fullPage: true });
});
