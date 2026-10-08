// Форматирует сумму в рублях: 12500 -> "12 500 ₽".
export function formatPrice(value) {
  const rounded = Math.round(value);
  return `${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}
