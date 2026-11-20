import { expect, test } from '@playwright/test';
import { calculateRental } from '../../src/calc.js';
import { formatPrice } from '../../src/format.js';

const COMBINATIONS = [
  { carId: 'larus-16', model: 'Ларус 1.6', days: 10, extras: [] },
  { carId: 'prima-sedan', model: 'Прима Седан', days: 7, extras: ['child-seat'] },
  { carId: 'nordkap-4x4', model: 'Нордкап 4×4', days: 14, extras: ['extra-driver', 'full-insurance'] },
];

test.describe('калькулятор', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const combo of COMBINATIONS) {
    test(`чек ${combo.carId}, ${combo.days} суток и ${combo.extras.length} опций совпадает с calculateRental`, async ({ page }) => {
      await page.selectOption('#calc-car', combo.carId);
      await page.fill('#calc-days', String(combo.days));
      for (const option of combo.extras) {
        await page.locator(`#calc-extras input[value="${option}"]`).check();
      }
      await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();

      const result = calculateRental(combo);
      const receipt = page.locator('#calc-result .receipt');
      await expect(receipt).toBeVisible();
      await expect(receipt).toContainText(`Аренда ${combo.model}, ${combo.days} сут.`);
      await expect(receipt.locator('.receipt__row').first()).toContainText(formatPrice(result.base));
      await expect(receipt.locator('.receipt__row--total .receipt__value')).toHaveText(formatPrice(result.total));
      await expect(receipt.locator('.receipt__row--deposit .receipt__value')).toHaveText(formatPrice(result.deposit));
      await expect(receipt.locator('.receipt__row').last()).toHaveClass(/receipt__row--deposit/);

      const discountRow = receipt.locator('.receipt__row', { hasText: 'Скидка за срок' });
      if (result.discount > 0) {
        await expect(discountRow).toContainText(`−${formatPrice(result.discount)}`);
      } else {
        await expect(discountRow).toHaveCount(0);
      }

      const extrasRow = receipt.locator('.receipt__row', { hasText: 'Опции,' });
      if (result.extrasTotal > 0) {
        await expect(extrasRow.locator('.receipt__value')).toHaveText(formatPrice(result.extrasTotal));
      } else {
        await expect(extrasRow).toHaveCount(0);
      }

      const insuranceRow = receipt.locator('.receipt__row', { hasText: 'Полная страховка' });
      if (result.insurance > 0) {
        await expect(insuranceRow.locator('.receipt__value')).toHaveText(formatPrice(result.insurance));
      } else {
        await expect(insuranceRow).toHaveCount(0);
      }
    });
  }

  for (const [value, expected] of [
    ['', 'Укажите срок аренды'],
    ['0', 'от 1 до 30'],
    ['31', 'от 1 до 30'],
  ]) {
    test(`срок ${value === '' ? 'пусто' : value} отклоняется без чека`, async ({ page }) => {
      await page.fill('#calc-days', value);
      await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();

      await expect(page.locator('#calc-error')).toContainText(expected);
      await expect(page.locator('#calc-days')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#calc-days')).toBeFocused();
      await expect(page.locator('#calc-result .receipt')).toHaveCount(0);
      await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');
    });
  }

  test('R-01: любой ввод после расчёта снимает чек и блокирует заявку', async ({ page }) => {
    await page.fill('#calc-days', '5');
    await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();
    await expect(page.locator('#calc-result .receipt')).toBeVisible();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');

    await page.locator('#calc-extra-child-seat').check();
    await expect(page.locator('#calc-result .receipt')).toHaveCount(0);
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');
    await expect(page.locator('#booking-name')).toBeDisabled();

    await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();
    await expect(page.locator('#calc-result .receipt')).toBeVisible();
    await page.selectOption('#calc-car', 'mirta-20');
    await expect(page.locator('#calc-result .receipt')).toHaveCount(0);
    await expect(page.locator('[data-car-id="mirta-20"]')).toHaveAttribute('data-chosen', 'true');
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');
  });

  test('семантика полей, подсказки опций и исправленные computed-размеры', async ({ page }) => {
    await expect(page.locator('label[for="calc-car"]')).toHaveText('Автомобиль');
    await expect(page.locator('label[for="calc-days"]')).toHaveText('Срок, суток');
    await expect(page.locator('#calc-days')).toHaveAttribute('type', 'number');
    await expect(page.locator('#calc-days')).toHaveAttribute('min', '1');
    await expect(page.locator('#calc-days')).toHaveAttribute('max', '30');
    await expect(page.locator('#calc-days')).toHaveAttribute('step', '1');
    await expect(page.locator('#calc-days')).toHaveAttribute('aria-describedby', 'calc-error');
    await expect(page.locator('#calc-error')).toHaveAttribute('role', 'alert');
    await expect(page.locator('#calc-form')).toHaveAttribute('novalidate', '');
    await expect(page.locator('#calc-extras input[type="checkbox"]')).toHaveCount(3);
    await expect(page.locator('#calc-extras')).toContainText('300 ₽ / сут');
    await expect(page.locator('#calc-extras')).toContainText('500 ₽ / сут');
    await expect(page.locator('#calc-extras')).toContainText('15 % от стоимости после скидки');

    const input = await page.locator('#calc-days').evaluate((node) => ({
      height: node.getBoundingClientRect().height,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
      padding: getComputedStyle(node).padding,
    }));
    expect(input.height).toBe(40);
    expect(input.scrollHeight).toBeLessThanOrEqual(input.clientHeight);
    expect(input.padding).toBe('8px 12px');

    for (const selector of ['#calc-car', '#fleet-filter-class', '#booking-name']) {
      const box = await page.locator(selector).boundingBox();
      expect(box.height, selector).toBe(40);
    }

    const checkbox = page.locator('#calc-extra-child-seat');
    await checkbox.check();
    const box = await checkbox.boundingBox();
    expect(box.width).toBe(16);
    expect(box.height).toBe(16);
    const checkMark = await checkbox.evaluate((node) => getComputedStyle(node, '::after').borderRightWidth);
    expect(checkMark).toBe('2px');

    const button = await page.getByRole('button', { name: 'Рассчитать стоимость' }).boundingBox();
    expect(button.height).toBe(40);
  });
});
