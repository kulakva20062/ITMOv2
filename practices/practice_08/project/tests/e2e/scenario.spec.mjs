// Полный основной сценарий на реальном API этого процесса:
// выбор машины -> расчёт -> заявка -> видимый номер -> сверка с GET /api/bookings/{id}.
import { expect, test } from '@playwright/test';
import { futureDate } from './helpers.mjs';

test('сценарий: от выбора машины до принятой заявки в реальном API', async ({ page }) => {
  const startDate = futureDate(90);

  await page.goto('/');

  // 1. Пользователь выбирает машину в автопарке.
  await page.locator('[data-car-id="korda-mini"] button[data-calc-for]').click();
  await expect(page.locator('#calc-car')).toHaveValue('korda-mini');

  // 2. Считает аренду на 7 суток со скидкой.
  await page.fill('#calc-days', '7');
  await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();

  const receipt = page.locator('#calc-result .receipt');
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText('Скидка за срок, 10 %');

  // 3. Форма заявки открылась с тем же снимком расчёта.
  await expect(page.locator('#booking-snapshot')).toContainText('Корда Мини');

  // 4. Заполняет данные и отправляет — без подмены, запрос идёт в server.js.
  await page.fill('#booking-name', 'Алекс Примеров');
  await page.fill('#booking-phone', '+7 000 123-45-67');
  await page.fill('#booking-date', startDate);
  await page.locator('#booking-submit').click();

  // 5. Видимый результат: карточка подтверждения с номером заявки.
  await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'success', { timeout: 10_000 });
  const result = page.locator('#booking-result');
  await expect(result).toContainText('Заявка принята');

  const announced = (await page.locator('#booking-status').textContent()) ?? '';
  expect(announced).toMatch(/AD-\d+/);
  const id = announced.match(/AD-\d+/)[0];

  // 6. Заявка действительно создалась на сервере: её можно прочитать по API.
  const response = await page.request.get(`/api/bookings/${id}`);
  expect(response.ok()).toBeTruthy();

  const booking = await response.json();
  expect(booking.carId).toBe('korda-mini');
  expect(booking.days).toBe(7);
  expect(booking.startDate).toBe(startDate);
  expect(booking.customer.name).toBe('Алекс Примеров');
});
