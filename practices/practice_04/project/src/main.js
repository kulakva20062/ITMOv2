// Склейка данных и разметки: автопарк и калькулятор строятся из src/cars.js.
import { cars } from './cars.js';
import { fleetHtml, carOptionsHtml, extrasFieldsHtml, receiptHtml } from './render.js';
import { formatPrice } from './format.js';
import { calculateRental } from './calc.js';

const list = document.getElementById('fleet-list');
const status = document.getElementById('fleet-status');

const form = document.getElementById('calc-form');
const carField = document.getElementById('calc-car');
const daysField = document.getElementById('calc-days');
const extrasBox = document.getElementById('calc-extras');
const errorBox = document.getElementById('calc-error');
const resultBox = document.getElementById('calc-result');

if (list) {
  list.innerHTML = fleetHtml(cars);
}

if (carField && extrasBox) {
  carField.innerHTML = carOptionsHtml(cars, cars[0]?.id);
  extrasBox.innerHTML = extrasFieldsHtml();
}

// Отметка выбранной машины в реестре — одна строка за раз.
function markChosen(carId) {
  if (!list) return;
  for (const row of list.querySelectorAll('[data-chosen]')) {
    delete row.dataset.chosen;
  }
  list.querySelector(`[data-car-id="${carId}"]`)?.setAttribute('data-chosen', 'true');
}

function showError(message) {
  if (errorBox) errorBox.textContent = message;
  // Ошибка всегда про срок: остальные входы калькулятор задаёт сам.
  daysField?.setAttribute('aria-invalid', 'true');
  if (resultBox) resultBox.innerHTML = '';
}

function clearError() {
  if (errorBox) errorBox.textContent = '';
  daysField?.removeAttribute('aria-invalid');
}

function clearResult() {
  clearError();
  if (resultBox) resultBox.innerHTML = '';
}

function calculate() {
  if (!carField || !daysField) return;

  const carId = carField.value;
  const raw = daysField.value.trim();
  if (raw === '') {
    showError('Укажите срок аренды — целое число суток от 1 до 30.');
    return;
  }
  const days = Number(raw);
  const extras = form
    ? [...form.querySelectorAll('input[name="extras"]:checked')].map((box) => box.value)
    : [];

  try {
    const result = calculateRental({ carId, days, extras });
    const car = cars.find((item) => item.id === carId);
    clearError();
    if (resultBox) resultBox.innerHTML = receiptHtml(result, { car, days });
  } catch (error) {
    if (error instanceof RangeError) {
      showError(error.message);
      return;
    }
    throw error;
  }
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
  });

  // Правка любого поля снимает устаревший итог: показываем только свежий расчёт.
  form.addEventListener('input', clearResult);

  carField?.addEventListener('change', () => markChosen(carField.value));
}

if (list) {
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-calc-for]');
    if (!button) return;

    const car = cars.find((item) => item.id === button.dataset.calcFor);
    if (!car) return;

    markChosen(car.id);

    if (status) {
      status.textContent = `Выбрана ${car.model} — ${formatPrice(car.pricePerDay)} за сутки.`;
    }

    // Кнопка в карточке выбирает машину в калькуляторе и прокручивает к нему.
    if (carField) {
      carField.value = car.id;
      clearResult();
      document.getElementById('calculator')?.scrollIntoView({ block: 'start' });
      carField.focus();
    }
  });
}
