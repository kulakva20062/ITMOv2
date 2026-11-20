import { expect, test } from '@playwright/test';
import { conflictText } from '../../src/booking-form.js';
import {
  conflictBody,
  fillDraft,
  fulfillJson,
  futureDate,
  internalErrorBody,
  makeEstimate,
  successBody,
  validationBody,
} from './helpers.mjs';

test.describe('заявка: состояния и валидация', () => {
  test('no-estimate: постоянные узлы, подписи и disabled; submit без расчёта не ходит в сеть', async ({ page }) => {
    let requests = 0;
    await page.route('**/api/bookings', (route) => {
      requests += 1;
      return route.abort();
    });
    await page.goto('/');

    const form = page.locator('#booking-form');
    await expect(form).toHaveAttribute('data-state', 'no-estimate');
    await expect(form).toHaveAttribute('novalidate', '');
    await expect(page.locator('#booking-empty')).toBeVisible();
    await expect(page.locator('#booking-empty-link')).toHaveAttribute('href', '#calculator');
    await expect(page.locator('#booking-snapshot')).toBeHidden();
    await expect(page.locator('#booking-result')).toBeEmpty();
    await expect(page.locator('#booking-submit')).toBeDisabled();
    await expect(page.locator('#booking-message')).toBeEmpty();
    await expect(page.locator('#booking-status')).toHaveAttribute('role', 'status');
    await expect(page.locator('#booking-status')).toBeEmpty();

    const fields = [
      ['booking-name', 'Имя', 'text'],
      ['booking-phone', 'Телефон', 'tel'],
      ['booking-date', 'Дата начала аренды', 'date'],
    ];
    for (const [id, label, type] of fields) {
      const field = page.locator(`#${id}`);
      await expect(field).toBeDisabled();
      await expect(field).toHaveAttribute('required', '');
      await expect(field).toHaveAttribute('type', type);
      await expect(field).toHaveAttribute('aria-describedby', `${id}-hint ${id}-error`);
      await expect(page.locator(`label[for="${id}"]`)).toHaveText(label);
      await expect(page.locator(`#${id}-hint`)).not.toBeEmpty();
      await expect(page.locator(`#${id}-error`)).toHaveAttribute('role', 'alert');
      await expect(page.locator(`#${id}-error`)).toBeEmpty();
    }
    expect(await page.locator('.booking__fields input').evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(
      fields.map(([id]) => id),
    );
    await expect(page.locator('#booking-date')).toHaveAttribute('min', futureDate(0));
    await expect(page.locator('#booking-date')).toHaveAttribute('max', futureDate(365));

    await page.evaluate(() => document.getElementById('booking-form').requestSubmit());
    expect(requests).toBe(0);
  });

  test('editing: снимок появляется из расчёта, поля открываются', async ({ page }) => {
    await makeEstimate(page, { extras: ['child-seat'] });

    const snapshot = page.locator('#booking-snapshot');
    await expect(snapshot).toBeVisible();
    await expect(snapshot).toContainText('Из расчёта выше');
    await expect(snapshot).toContainText('Ларус 1.6');
    await expect(snapshot).toContainText('3 сут.');
    await expect(snapshot).toContainText('Детское кресло');
    await expect(snapshot.locator('.receipt__row--total')).toContainText('Итого');
    await expect(page.locator('#booking-empty')).toBeHidden();
    await expect(page.locator('#booking-name')).toBeEnabled();
    await expect(page.locator('#booking-submit')).toBeEnabled();
    await expect(page.locator('#booking-submit')).toHaveAttribute('aria-busy', 'false');
  });

  test('пустые обязательные поля: все ошибки, фокус на имени, сети нет; правка снимает только свою ошибку', async ({ page }) => {
    await makeEstimate(page);
    let requests = 0;
    await page.route('**/api/bookings', (route) => {
      requests += 1;
      return route.abort();
    });

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-name-error')).toContainText('Укажите имя');
    await expect(page.locator('#booking-phone-error')).toContainText('Укажите телефон');
    await expect(page.locator('#booking-date-error')).toContainText('Выберите дату');
    await expect(page.locator('#booking-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#booking-phone')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#booking-date')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#booking-name')).toBeFocused();
    expect(requests).toBe(0);

    await page.fill('#booking-name', 'Тест');
    await expect(page.locator('#booking-name-error')).toBeEmpty();
    await expect(page.locator('#booking-name')).not.toHaveAttribute('aria-invalid');
    await expect(page.locator('#booking-phone-error')).toContainText('Укажите телефон');
    await expect(page.locator('#booking-date-error')).toContainText('Выберите дату');
  });

  test('некорректный телефон: локальная ошибка без сети, исправление снимает aria-invalid', async ({ page }) => {
    await makeEstimate(page);
    await fillDraft(page, { phone: '123' });
    let requests = 0;
    await page.route('**/api/bookings', (route) => {
      requests += 1;
      return route.abort();
    });

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-phone-error')).toContainText('11 цифр');
    await expect(page.locator('#booking-phone')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#booking-phone')).toBeFocused();
    expect(requests).toBe(0);

    await page.fill('#booking-phone', '+7 000 111-22-33');
    await expect(page.locator('#booking-phone-error')).toBeEmpty();
    await expect(page.locator('#booking-phone')).not.toHaveAttribute('aria-invalid');
  });

  test('submitting: Enter + requestSubmit + повторные клики создают ровно один POST, success — ноль новых', async ({ page }) => {
    await makeEstimate(page);
    const draft = await fillDraft(page);
    const requests = [];
    let releaseResponse;
    const responseGate = new Promise((resolve) => {
      releaseResponse = resolve;
    });

    await page.route('**/api/bookings', async (route) => {
      const payload = route.request().postDataJSON();
      requests.push(payload);
      await responseGate;
      await fulfillJson(route, 201, successBody(payload));
    });

    await page.locator('#booking-date').press('Enter');
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'submitting');
    await expect(page.locator('#booking-spinner')).toBeVisible();
    await expect(page.locator('#booking-spinner')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#booking-submit')).toContainText('Отправляем заявку…');
    await expect(page.locator('#booking-submit')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#booking-submit')).toBeDisabled();
    await expect(page.locator('#booking-name')).toBeDisabled();
    await expect(page.locator('#booking-status')).toHaveText('Отправляем заявку…');
    await expect(page.locator('#booking-snapshot')).toBeVisible();

    await page.keyboard.press('Enter');
    await page.locator('#booking-submit').dispatchEvent('click');
    await page.evaluate(() => {
      const form = document.getElementById('booking-form');
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.locator('#booking-submit').dispatchEvent('click');
    await expect.poll(() => requests.length).toBe(1);

    expect(Object.keys(requests[0]).sort()).toEqual(['carId', 'days', 'extras', 'name', 'phone', 'startDate']);
    expect(requests[0]).toMatchObject({ carId: 'larus-16', days: 3, extras: [], ...draft });
    expect(typeof requests[0].days).toBe('number');

    releaseResponse();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'success');
    await expect(page.locator('#booking-result')).toContainText('AD-7777');

    await page.evaluate(() => document.getElementById('booking-form').requestSubmit());
    await page.keyboard.press('Enter');
    await page.locator('#booking-submit').dispatchEvent('click');
    await page.waitForTimeout(100);
    expect(requests).toHaveLength(1);
  });

  test('201: штамп, полный чек без телефона и повторная заявка через отдельную кнопку', async ({ page }) => {
    await makeEstimate(page);
    await fillDraft(page);
    await page.route('**/api/bookings', (route) =>
      fulfillJson(route, 201, successBody(route.request().postDataJSON())),
    );

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'success');
    const result = page.locator('#booking-result');
    await expect(result.locator('.success-stamp')).toContainText('Заявка принята');
    await expect(result.locator('.success-stamp')).toContainText('AD-7777');
    await expect(result.locator('.receipt')).toContainText('Номер заявки');
    await expect(result.locator('.receipt')).toContainText('Ларус 1.6');
    await expect(result.locator('.receipt')).toContainText('3 сут.');
    await expect(result).not.toContainText('+70001112233');
    await expect(page.locator('.booking__fields')).toBeHidden();
    await expect(page.locator('#booking-required')).toBeHidden();
    await expect(page.locator('#booking-submit')).toBeHidden();
    await expect(page.locator('#booking-snapshot')).toBeHidden();
    await expect(page.locator('#booking-status')).toHaveText('Заявка № AD-7777 принята.');

    await page.locator('#booking-again').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');
    await expect(page.locator('#booking-name')).toHaveValue('');
    await expect(page.locator('#booking-phone')).toHaveValue('');
    await expect(page.locator('#booking-date')).toHaveValue('');
    await expect(page.locator('#booking-empty-link')).toBeFocused();
  });

  test('500: unavailable с сохранённым черновиком, повтор отправляет новый запрос и завершается успехом', async ({ page }) => {
    await makeEstimate(page);
    const draft = await fillDraft(page);
    let unavailableRequests = 0;
    await page.route('**/api/bookings', (route) => {
      unavailableRequests += 1;
      return fulfillJson(route, 500, internalErrorBody());
    });

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'unavailable');
    await expect(page.locator('#booking-status')).toContainText('сервер не ответил');
    await expect(page.locator('#booking-submit')).toBeEnabled();
    await expect(page.locator('#booking-name')).toHaveValue(draft.name);
    await expect(page.locator('#booking-phone')).toHaveValue(draft.phone);
    await expect(page.locator('#booking-date')).toHaveValue(draft.startDate);
    expect(unavailableRequests).toBe(1);

    await page.unroute('**/api/bookings');
    let retryRequests = 0;
    await page.route('**/api/bookings', (route) => {
      retryRequests += 1;
      return fulfillJson(route, 201, successBody(route.request().postDataJSON()));
    });
    await page.locator('#booking-submit').click();
    await expect.poll(() => retryRequests).toBe(1);
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'success');
    await expect(page.locator('#booking-result')).toContainText('AD-7777');
  });

  test('409: date_conflict показывает занятые даты, неизвестный код — rejected', async ({ page }) => {
    await makeEstimate(page);
    await fillDraft(page);
    const body = conflictBody({
      carId: 'larus-16',
      days: 3,
      extras: [],
      name: 'Тест Тестов',
      phone: '+7 000 111-22-33',
      startDate: futureDate(40),
    });
    await page.route('**/api/bookings', (route) => fulfillJson(route, 409, body));

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');
    await expect(page.locator('#booking-date-error')).toHaveText(conflictText(body.error.conflict));
    await expect(page.locator('#booking-date')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#booking-date')).toBeFocused();
    await expect(page.locator('#booking-submit')).toBeEnabled();

    await page.unroute('**/api/bookings');
    await page.route('**/api/bookings', (route) => fulfillJson(route, 409, {
      error: {
        code: 'unexpected',
        message: 'Серверную формулировку показывать нельзя.',
        fields: [],
        conflict: body.error.conflict,
      },
    }));
    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');
    await expect(page.locator('#booking-message')).toHaveText('Заявка не принята. Проверьте поля и отправьте ещё раз.');
    await expect(page.locator('#booking-date-error')).toBeEmpty();
    await expect(page.locator('#booking-date')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#booking-submit')).toBeEnabled();
  });

  test('400 validation_failed: per-field ошибки из codes, а не серверные message', async ({ page }) => {
    await makeEstimate(page);
    await fillDraft(page);
    const body = validationBody([
      { field: 'name', code: 'name_charset', message: 'Серверную фразу имени показывать нельзя.' },
      { field: 'phone', code: 'phone_invalid', message: 'Серверную фразу телефона показывать нельзя.' },
      { field: 'startDate', code: 'date_too_far', message: 'Серверную фразу даты показывать нельзя.' },
    ]);
    await page.route('**/api/bookings', (route) => fulfillJson(route, 400, body));

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');
    await expect(page.locator('#booking-name-error')).toHaveText('Имя — только буквы, пробел, дефис и апостроф.');
    await expect(page.locator('#booking-phone-error')).toContainText('Телефон должен содержать 11 цифр');
    await expect(page.locator('#booking-date-error')).toContainText('Дата начала не дальше 365 дней от сегодня.');
    await expect(page.locator('#booking-name')).toBeFocused();
    await expect(page.locator('#booking-message')).toBeEmpty();
    await expect(page.locator('#booking-form')).not.toContainText('Серверную фразу');
  });

  test('400 по снимку: no-estimate + stale, введённые поля сохраняются', async ({ page }) => {
    await makeEstimate(page);
    const draft = await fillDraft(page);
    const body = validationBody([
      { field: 'days', code: 'days_out_of_range', message: 'Срок аренды — целое число суток от 1 до 30.' },
    ]);
    await page.route('**/api/bookings', (route) => fulfillJson(route, 400, body));

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');
    await expect(page.locator('#booking-message')).toHaveText('Расчёт устарел — пересчитайте стоимость в калькуляторе.');
    await expect(page.locator('#booking-empty')).toBeVisible();
    await expect(page.locator('#booking-name')).toBeDisabled();
    await expect(page.locator('#booking-name')).toHaveValue(draft.name);
    await expect(page.locator('#booking-phone')).toHaveValue(draft.phone);
    await expect(page.locator('#booking-date')).toHaveValue(draft.startDate);
  });

  test('201 с битым телом: rejected, черновик сохранён, повтор разрешён', async ({ page }) => {
    await makeEstimate(page);
    const draft = await fillDraft(page);
    let requests = 0;
    await page.route('**/api/bookings', (route) => {
      requests += 1;
      return fulfillJson(route, 201, {});
    });

    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');
    await expect(page.locator('#booking-message')).toHaveText('Заявка не принята. Проверьте поля и отправьте ещё раз.');
    await expect(page.locator('#booking-submit')).toBeEnabled();
    await expect(page.locator('#booking-name')).toHaveValue(draft.name);
    await expect(page.locator('#booking-phone')).toHaveValue(draft.phone);
    await expect(page.locator('#booking-date')).toHaveValue(draft.startDate);

    await page.unroute('**/api/bookings');
    await page.route('**/api/bookings', (route) => {
      requests += 1;
      return fulfillJson(route, 201, successBody(route.request().postDataJSON()));
    });
    await page.locator('#booking-submit').click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'success');
    expect(requests).toBe(2);
  });
});

test.describe('доступность и клавиатура', () => {
  test('focus-visible: двойной индикатор на paper и signal-outline на night', async ({ page }) => {
    await page.goto('/');

    const heroCta = page.locator('#hero a[href="#fleet"]');
    await heroCta.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(heroCta).toBeFocused();
    const nightFocus = await heroCta.evaluate((node) => ({
      visible: node.matches(':focus-visible'),
      width: getComputedStyle(node).outlineWidth,
      style: getComputedStyle(node).outlineStyle,
    }));
    expect(nightFocus).toEqual({ visible: true, width: '3px', style: 'solid' });

    await page.locator('#calc-car').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#calc-days')).toBeFocused();
    const paperFocus = await page.locator('#calc-days').evaluate((node) => ({
      visible: node.matches(':focus-visible'),
      width: getComputedStyle(node).outlineWidth,
      style: getComputedStyle(node).outlineStyle,
      shadow: getComputedStyle(node).boxShadow,
    }));
    expect(paperFocus.visible).toBe(true);
    expect(paperFocus.width).toBe('2px');
    expect(paperFocus.style).toBe('solid');
    expect(paperFocus.shadow).not.toBe('none');
  });

  test('полный сценарий с клавиатуры: стрелки в select, Tab по полям, Enter-отправка', async ({ page }) => {
    await page.goto('/');
    let requests = 0;
    await page.route('**/api/bookings', (route) => {
      requests += 1;
      return fulfillJson(route, 201, successBody(route.request().postDataJSON()));
    });

    await page.locator('#calc-car').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#calc-car')).toHaveValue('korda-mini');
    await page.keyboard.press('Tab');
    await expect(page.locator('#calc-days')).toBeFocused();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('7');
    await page.keyboard.press('Enter');
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');
    await expect(page.locator('#booking-snapshot')).toContainText('Корда Мини');

    let reached = '';
    for (let index = 0; index < 12 && reached !== 'booking-name'; index += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement.id);
    }
    expect(reached, 'Tab дошёл до поля имени').toBe('booking-name');

    await page.keyboard.type('Алекс Примеров');
    await page.keyboard.press('Tab');
    await expect(page.locator('#booking-phone')).toBeFocused();
    await page.keyboard.type('+7 000 555-44-33');
    await page.keyboard.press('Tab');
    await expect(page.locator('#booking-date')).toBeFocused();
    // Посегментный ввод type=date зависит от локали, поэтому значение ставит fill.
    await page.locator('#booking-date').fill(futureDate(60));
    await page.keyboard.press('Enter');

    await expect(page.locator('#booking-result')).toContainText('AD-7777');
    expect(requests).toBe(1);
  });

  for (const width of [360, 1280]) {
    test(`${width}px: нет горизонтального overflow, заявка и поля доступны`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await makeEstimate(page);
      await fillDraft(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      await page.locator('#booking-submit').scrollIntoViewIfNeeded();
      await expect(page.locator('#booking-submit')).toBeInViewport();
      if (width === 360) {
        const boxes = await page.locator('.booking__fields > .field').evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { x: box.x, y: box.y, width: box.width };
          }),
        );
        expect(boxes[1].y).toBeGreaterThan(boxes[0].y);
        expect(boxes[2].y).toBeGreaterThan(boxes[1].y);
        expect(new Set(boxes.map((box) => box.x)).size).toBe(1);
        for (const box of boxes) expect(box.width).toBeLessThanOrEqual(328);
      }
    });
  }
});
