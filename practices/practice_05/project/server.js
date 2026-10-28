// HTTP-слой заявки на бронирование: роутинг, чтение тела, коды ответов.
// Логики здесь нет — она в src/booking.js и src/booking-store.js (контракт §1).
// Один процесс отдаёт и статику лендинга, и /api/**: UI и API на одном источнике.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { conflictView, overlaps, todayUtc, validateBooking } from './src/booking.js';
import { store as defaultStore } from './src/booking-store.js';
import { calculateRental } from './src/calc.js';

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const JSON_TYPE = 'application/json; charset=utf-8';

// Тело больше 8 КБ не разбирается (контракт §4).
const MAX_BODY_BYTES = 8192;

// Контракт §1 перечисляет, что отдаётся статикой: страница, её стили и модули src/.
// Белый список вместо «любой файл из корня» — иначе наружу уехали бы docs/, specs/ и AGENTS.md.
const STATIC_FILES = new Set(['index.html', 'styles.css']);
const STATIC_PREFIX = 'src/';

function isStaticAllowed(relative) {
  return STATIC_FILES.has(relative) || relative.startsWith(STATIC_PREFIX);
}

function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': JSON_TYPE, ...headers });
  res.end(payload);
}

// Единая форма тела ошибки по контракту §5: fields — массив всегда.
function sendError(res, status, code, message, extra = {}, headers = {}) {
  sendJson(res, status, { error: { code, message, fields: [], ...extra } }, headers);
}

function notFound(res) {
  sendError(res, 404, 'not_found', 'Такого адреса нет.');
}

// Заголовок Allow обязателен при 405 (контракт §5).
function methodNotAllowed(res, allow) {
  sendError(
    res,
    405,
    'method_not_allowed',
    `Метод не поддерживается. Разрешено: ${allow}.`,
    {},
    { Allow: allow },
  );
}

async function serveStatic(req, res, root) {
  const url = new URL(req.url, 'http://localhost');
  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);

  if (!isStaticAllowed(relative)) {
    notFound(res);
    return;
  }

  const target = path.resolve(root, relative);

  // Защита на второй рубеж: собранный путь обязан остаться внутри корня проекта.
  if (!target.startsWith(root + path.sep)) {
    notFound(res);
    return;
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) {
      notFound(res);
      return;
    }

    const body = await readFile(target);
    const type = MIME_TYPES[path.extname(target)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
    res.end(body);
  } catch {
    notFound(res);
  }
}

// Сколько полей заполнено неверно — для сводной формулировки ответа 400.
function fieldsWord(count) {
  const tail = count % 100 >= 11 && count % 100 <= 14 ? 0 : count % 10;
  if (tail === 1) {
    return 'поле заполнено неверно';
  }

  return tail >= 2 && tail <= 4 ? 'поля заполнены неверно' : 'полей заполнено неверно';
}

// Читает тело запроса целиком. Лимит считается в байтах: больше 8 КБ не разбираем.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        resolve({ tooLarge: true });
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => resolve({ tooLarge: false, raw: Buffer.concat(chunks).toString('utf8') }));
    req.on('error', reject);
  });
}

// Content-Type: application/json обязателен; параметры вроде charset допустимы (контракт §4).
function isJsonRequest(req) {
  const header = req.headers['content-type'];
  if (typeof header !== 'string') {
    return false;
  }

  return header.split(';')[0].trim().toLowerCase() === 'application/json';
}

async function handleCreateBooking(req, res, deps) {
  if (!isJsonRequest(req)) {
    sendError(
      res,
      415,
      'unsupported_media_type',
      'Заявка отправляется с заголовком Content-Type: application/json.',
    );
    return;
  }

  // Быстрый отказ по заголовку; он может лгать или отсутствовать, поэтому
  // настоящий лимит всё равно считается по байтам прочитанных чанков.
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    sendError(res, 413, 'payload_too_large', 'Тело запроса больше 8 КБ.');
    return;
  }

  const body = await readBody(req);
  if (body.tooLarge) {
    sendError(res, 413, 'payload_too_large', 'Тело запроса больше 8 КБ.');
    return;
  }

  let payload;
  try {
    payload = JSON.parse(body.raw);
  } catch {
    sendError(res, 400, 'invalid_json', 'Тело запроса — JSON-объект.');
    return;
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    sendError(res, 400, 'invalid_json', 'Тело запроса — JSON-объект.');
    return;
  }

  const checked = validateBooking(payload, deps.today());
  if (!checked.ok) {
    const count = checked.errors.length;
    sendError(
      res,
      400,
      'validation_failed',
      `Проверьте поля заявки: ${count} ${fieldsWord(count)}.`,
      { fields: checked.errors },
    );
    return;
  }

  // Дальше — без await: проверка занятости и запись должны быть неделимы (контракт §8).
  const { carId, days, extras, name, phone, startDate, endDate } = checked.value;

  // Повторная идентичная заявка возвращает существующую бронь. Проверяется до
  // правила пересечения, иначе посетитель получил бы 409 от собственной брони (контракт §9).
  const same = deps.store.findSame({ carId, startDate, days, extras, name, phone });
  if (same) {
    sendJson(res, 200, same);
    return;
  }

  const busy = deps.store
    .intervalsFor(carId)
    .find((interval) => overlaps(interval, { startDate, endDate }));

  if (busy) {
    const view = conflictView(busy);
    sendError(res, 409, 'date_conflict', view.message, {
      fields: view.fields,
      conflict: { carId, startDate: busy.startDate, endDate: busy.endDate },
    });
    return;
  }

  const price = calculateRental({ carId, days, extras });
  const booking = deps.store.add({ ...checked.value, price }, deps.now());

  sendJson(res, 201, booking, { Location: `/api/bookings/${booking.id}` });
}

function handleGetBooking(res, deps, id) {
  const booking = deps.store.findById(id);
  if (!booking) {
    sendError(res, 404, 'booking_not_found', `Заявки с номером ${id} нет.`);
    return;
  }

  sendJson(res, 200, booking);
}

function routeApi(req, res, pathname, deps) {
  if (pathname === '/api/bookings') {
    if (req.method !== 'POST') {
      methodNotAllowed(res, 'POST');
      return;
    }

    return handleCreateBooking(req, res, deps);
  }

  const booking = pathname.match(/^\/api\/bookings\/([^/]+)$/);
  if (booking) {
    if (req.method !== 'GET') {
      methodNotAllowed(res, 'GET');
      return;
    }

    handleGetBooking(res, deps, decodeURIComponent(booking[1]));
    return;
  }

  notFound(res);
}

export function createBookingServer(options = {}) {
  const store = options.store ?? defaultStore;
  const today = options.today ?? todayUtc;
  const now = options.now ?? (() => new Date().toISOString());
  const root = path.resolve(options.root ?? PROJECT_ROOT);

  // Любой непредвиденный сбой — 500 без внутренних подробностей; процесс продолжает работу.
  function fail(res, error) {
    console.error('booking-api:', error);
    if (res.headersSent) {
      res.end();
      return;
    }

    sendError(res, 500, 'internal_error', 'Внутренняя ошибка сервера.');
  }

  return createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      notFound(res);
      return;
    }

    try {
      // Путь, начинающийся с /api/, никогда не обслуживается как файл.
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        Promise.resolve(routeApi(req, res, url.pathname, { store, today, now })).catch((error) =>
          fail(res, error),
        );
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        methodNotAllowed(res, 'GET, HEAD');
        return;
      }

      serveStatic(req, res, root).catch((error) => fail(res, error));
    } catch (error) {
      fail(res, error);
    }
  });
}

// Порт слушаем только при прямом запуске: тесты поднимают сервер на свободном порту.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createBookingServer().listen(PORT, () => {
    console.log(`AutoDrive: http://localhost:${PORT}/`);
  });
}
