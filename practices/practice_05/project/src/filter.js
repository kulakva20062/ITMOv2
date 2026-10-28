// Отбор машин автопарка по классу и коробке: чистые функции, без обращений к DOM.
import { CAR_CLASSES, GEARBOXES } from './cars.js';
import { escapeHtml } from './render.js';

// Значение «любой»: явная строка, а не пустая — неизвестное значение нельзя
// спутать с «без ограничения» и тихо показать весь автопарк.
export const FILTER_ANY = 'any';

export const EMPTY_MESSAGE =
  'Под эти условия машин нет — выберите «Любой класс» или «Любая коробка»';

// Отсутствие значения читается как «любой»: селект мог ещё не быть заполнен.
function isAny(value) {
  return value === undefined || value === null || value === FILTER_ANY;
}

function checkValue(value, allowed, missing, plural) {
  if (isAny(value) || allowed.includes(value)) return;
  throw new RangeError(
    `${missing}: ${String(value)}. Допустимые ${plural}: ${allowed.join(', ')}.`,
  );
}

export function filterCars(list, { carClass, gearbox } = {}) {
  checkValue(carClass, CAR_CLASSES, 'Нет такого класса в автопарке', 'классы');
  checkValue(gearbox, GEARBOXES, 'Нет такой коробки в автопарке', 'коробки');

  return list.filter(
    (car) =>
      (isAny(carClass) || car.class === carClass) && (isAny(gearbox) || car.gearbox === gearbox),
  );
}

// Опции селекта фильтра: «любой» первым и выбранным, затем значения со подписями.
export function filterOptionsHtml(values, labels, anyLabel) {
  const head = `<option value="${FILTER_ANY}" selected>${escapeHtml(anyLabel)}</option>`;
  const rest = values
    .map((value) => {
      const id = escapeHtml(value);
      return `<option value="${id}">${escapeHtml(labels[value] ?? value)}</option>`;
    })
    .join('');
  return head + rest;
}

export function countLabel(shown, total) {
  return `Показано ${shown} из ${total}`;
}
