// Склейка данных и разметки: автопарк строится из src/cars.js.
import { cars } from './cars.js';
import { fleetHtml } from './render.js';
import { formatPrice } from './format.js';

const list = document.getElementById('fleet-list');
const status = document.getElementById('fleet-status');

if (list) {
  list.innerHTML = fleetHtml(cars);

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-calc-for]');
    if (!button) return;

    const car = cars.find((item) => item.id === button.dataset.calcFor);
    if (!car) return;

    for (const row of list.querySelectorAll('[data-chosen]')) {
      delete row.dataset.chosen;
    }
    button.closest('.car').dataset.chosen = 'true';

    if (status) {
      status.textContent = `Выбрана ${car.model} — ${formatPrice(car.pricePerDay)} за сутки.`;
    }
  });
}
