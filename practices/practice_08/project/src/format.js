// Форматирует сумму в рублях: 12500 -> "12 500 ₽".
export function formatPrice(value) {
  const rounded = Math.round(value);
  return `${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}

// Форматирует ISO-дату для показа: "2026-11-10" -> "10.11.2026".
export function formatDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new RangeError(`Дата передаётся строкой вида ГГГГ-ММ-ДД. Получено: ${String(iso)}.`);
  }

  const [year, month, day] = iso.split('-');
  return `${day}.${month}.${year}`;
}
