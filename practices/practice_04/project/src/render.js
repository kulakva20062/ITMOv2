// Чистые функции разметки автопарка и расчёта: без обращений к DOM.
import { CLASS_LABELS, GEARBOX_LABELS } from './cars.js';
import { formatPrice } from './format.js';
import { EXTRA_OPTIONS, EXTRA_LABELS, EXTRAS, discountRate } from './calc.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

// 1 место, 4 места, 5 мест.
export function seatsLabel(seats) {
  const tail = seats % 100;
  if (tail >= 11 && tail <= 14) return `${seats} мест`;
  const last = seats % 10;
  if (last === 1) return `${seats} место`;
  if (last >= 2 && last <= 4) return `${seats} места`;
  return `${seats} мест`;
}

function field(label, value, modifier = '') {
  return (
    `<p class="car__field${modifier}">` +
    `<span class="car__label">${escapeHtml(label)}</span>` +
    `<span class="car__value">${value}</span>` +
    '</p>'
  );
}

export function carRowHtml(car) {
  const id = escapeHtml(car.id);
  return (
    `<article class="car" data-car-id="${id}">` +
    `<h3 class="car__model">${escapeHtml(car.model)}</h3>` +
    field('Класс', escapeHtml(CLASS_LABELS[car.class] ?? car.class)) +
    field('Коробка', escapeHtml(GEARBOX_LABELS[car.gearbox] ?? car.gearbox)) +
    field('Салон', escapeHtml(seatsLabel(car.seats))) +
    field(
      'Цена за сутки',
      `${escapeHtml(formatPrice(car.pricePerDay))}<span class="car__per"> / сут</span>`,
      ' car__field--price',
    ) +
    `<button class="car__action" type="button" data-calc-for="${id}">Рассчитать</button>` +
    '</article>'
  );
}

export function fleetHtml(list) {
  return list.map(carRowHtml).join('');
}

// --- Калькулятор ---

// Сутки в подписи строки: 1 сутки, 2 суток — склонения у «суток» одно, но число нужно.
function daysLabel(days) {
  return `${days} сут.`;
}

export function carOptionsHtml(list, selectedId) {
  return list
    .map((car) => {
      const id = escapeHtml(car.id);
      const chosen = car.id === selectedId ? ' selected' : '';
      const label = `${car.model} — ${formatPrice(car.pricePerDay)} / сут`;
      return `<option value="${id}"${chosen}>${escapeHtml(label)}</option>`;
    })
    .join('');
}

// Подпись опции: цена за сутки у кресла и водителя, процент у страховки.
export function extraHint(option) {
  if (option in EXTRAS) return `${formatPrice(EXTRAS[option])} / сут`;
  return '15 % от стоимости после скидки';
}

export function extrasFieldsHtml(options = EXTRA_OPTIONS) {
  return options
    .map((option) => {
      const id = escapeHtml(option);
      return (
        '<label class="extra">' +
        `<input class="extra__box" type="checkbox" name="extras" value="${id}" />` +
        `<span class="extra__name">${escapeHtml(EXTRA_LABELS[option] ?? option)}</span>` +
        `<span class="extra__hint">${escapeHtml(extraHint(option))}</span>` +
        '</label>'
      );
    })
    .join('');
}

function receiptRow(label, value, modifier = '') {
  return (
    `<div class="receipt__row${modifier}">` +
    `<dt class="receipt__label">${escapeHtml(label)}</dt>` +
    `<dd class="receipt__value">${escapeHtml(value)}</dd>` +
    '</div>'
  );
}

// Расшифровка итога. result — ответ calculateRental, car — выбранная машина.
export function receiptHtml(result, { car, days }) {
  const rows = [receiptRow(`Аренда ${car.model}, ${daysLabel(days)}`, formatPrice(result.base))];

  if (result.discount > 0) {
    const percent = Math.round(discountRate(days) * 100);
    rows.push(receiptRow(`Скидка за срок, ${percent} %`, `−${formatPrice(result.discount)}`));
  }

  if (result.extrasTotal > 0) {
    rows.push(receiptRow(`Опции, ${daysLabel(days)}`, formatPrice(result.extrasTotal)));
  }

  if (result.insurance > 0) {
    rows.push(receiptRow('Полная страховка', formatPrice(result.insurance)));
  }

  rows.push(receiptRow('Итого к оплате', formatPrice(result.total), ' receipt__row--total'));
  rows.push(
    receiptRow('Залог, вернём при сдаче', formatPrice(result.deposit), ' receipt__row--deposit'),
  );

  return `<dl class="receipt">${rows.join('')}</dl>`;
}
