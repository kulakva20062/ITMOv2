// Единственная точка fetch заявки (design-contract §7). Путь относительный: в dev запрос
// идёт через server.proxy '/api' на :8000, в prod — на тот же origin, CORS не возникает.
// Исход нормализуется в вход responseView: решения по нему принимает только @legacy/booking-form.js.

// Тело POST /api/bookings по контракту §4: ровно шесть полей, без сумм и endDate.
export type BookingPayload = {
  carId: string;
  days: number;
  extras: string[];
  name: string;
  phone: string;
  startDate: string;
};

export type BookingOutcome =
  | { kind: 'json'; status: number; body: unknown }
  | { kind: 'timeout' | 'network' | 'unparsable' };

// UI ждёт ответ 10 секунд (контракт §10); дальше — состояние «сервер недоступен».
const SUBMIT_TIMEOUT_MS = 10_000;

export async function sendBooking(payload: BookingPayload): Promise<BookingOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      return { kind: 'unparsable' };
    }

    return { kind: 'json', status: response.status, body };
  } catch (error) {
    return { kind: (error as DOMException | null)?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
