// Чистые функции разметки автопарка: строка на машину, без обращений к DOM.
import { CLASS_LABELS, GEARBOX_LABELS } from './cars.js';
import { formatPrice } from './format.js';

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
