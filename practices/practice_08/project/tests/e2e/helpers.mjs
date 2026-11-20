import { expect } from '@playwright/test';
import { addDays, conflictView, normalizePhone } from '../../src/booking.js';
import { calculateRental } from '../../src/calc.js';

// Все даты сценариев вычисляются от текущих UTC-суток, а не зашиты в тестах.
export function futureDate(days) {
  const date = new Date(Date.now() + days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export async function makeEstimate(page, { carId = 'larus-16', days = 3, extras = [] } = {}) {
  await page.goto('/');
  await page.selectOption('#calc-car', carId);
  await page.fill('#calc-days', String(days));
  for (const option of extras) {
    await page.locator(`#calc-extras input[value="${option}"]`).check();
  }
  await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();
  await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');
}

export async function fillDraft(page, overrides = {}) {
  const draft = {
    name: 'Тест Тестов',
    phone: '+7 000 111-22-33',
    startDate: futureDate(40),
    ...overrides,
  };
  await page.fill('#booking-name', draft.name);
  await page.fill('#booking-phone', draft.phone);
  await page.fill('#booking-date', draft.startDate);
  return draft;
}

// Полное тело 201/200 той же формы, которую собирает server.js.
export function successBody(payload, { id = 'AD-7777', total } = {}) {
  const price = calculateRental(payload);
  if (total !== undefined) {
    price.total = total;
  }

  return {
    id,
    status: 'confirmed',
    carId: payload.carId,
    startDate: payload.startDate,
    endDate: addDays(payload.startDate, payload.days),
    days: payload.days,
    extras: [...payload.extras],
    customer: { name: payload.name.trim(), phone: normalizePhone(payload.phone) },
    price,
    createdAt: new Date().toISOString(),
  };
}

// Полное тело 409: error.fields и обязательный полуоткрытый error.conflict.
export function conflictBody(payload, conflict = {}) {
  const busy = {
    carId: payload.carId,
    startDate: conflict.startDate ?? payload.startDate,
    endDate: conflict.endDate ?? addDays(payload.startDate, payload.days),
  };
  const view = conflictView(busy);
  return {
    error: {
      code: 'date_conflict',
      message: view.message,
      fields: view.fields,
      conflict: busy,
    },
  };
}

export function validationBody(fields) {
  const tail = fields.length % 100 >= 11 && fields.length % 100 <= 14 ? 0 : fields.length % 10;
  const word = tail === 1
    ? 'поле заполнено неверно'
    : tail >= 2 && tail <= 4
      ? 'поля заполнены неверно'
      : 'полей заполнено неверно';
  return {
    error: {
      code: 'validation_failed',
      message: `Проверьте поля заявки: ${fields.length} ${word}.`,
      fields,
    },
  };
}

export function internalErrorBody() {
  return {
    error: { code: 'internal_error', message: 'Внутренняя ошибка сервера.', fields: [] },
  };
}

export function fulfillJson(route, status, body) {
  const headers = status === 201 && body?.id ? { Location: `/api/bookings/${body.id}` } : {};
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers,
    body: JSON.stringify(body),
  });
}
