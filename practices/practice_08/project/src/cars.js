// Автопарк AutoDrive. Все модели вымышленные.
export const CAR_CLASSES = ['economy', 'comfort', 'business', 'suv'];
export const GEARBOXES = ['manual', 'automatic'];

export const CLASS_LABELS = {
  economy: 'эконом',
  comfort: 'комфорт',
  business: 'бизнес',
  suv: 'внедорожник',
};

export const GEARBOX_LABELS = {
  manual: 'механика',
  automatic: 'автомат',
};

// 1 место, 4 места, 5 мест.
export function seatsLabel(seats) {
  const tail = seats % 100;
  if (tail >= 11 && tail <= 14) return `${seats} мест`;
  const last = seats % 10;
  if (last === 1) return `${seats} место`;
  if (last >= 2 && last <= 4) return `${seats} места`;
  return `${seats} мест`;
}

export const cars = [
  {
    id: 'larus-16',
    model: 'Ларус 1.6',
    class: 'economy',
    gearbox: 'manual',
    seats: 5,
    pricePerDay: 2400,
  },
  {
    id: 'korda-mini',
    model: 'Корда Мини',
    class: 'economy',
    gearbox: 'automatic',
    seats: 4,
    pricePerDay: 2900,
  },
  {
    id: 'mirta-20',
    model: 'Мирта 2.0',
    class: 'comfort',
    gearbox: 'automatic',
    seats: 5,
    pricePerDay: 3800,
  },
  {
    id: 'silta-universal',
    model: 'Сильта Универсал',
    class: 'comfort',
    gearbox: 'manual',
    seats: 5,
    pricePerDay: 3500,
  },
  {
    id: 'prima-sedan',
    model: 'Прима Седан',
    class: 'business',
    gearbox: 'automatic',
    seats: 5,
    pricePerDay: 7200,
  },
  {
    id: 'prima-long',
    model: 'Прима Лонг',
    class: 'business',
    gearbox: 'automatic',
    seats: 4,
    pricePerDay: 9100,
  },
  {
    id: 'nordkap-4x4',
    model: 'Нордкап 4×4',
    class: 'suv',
    gearbox: 'automatic',
    seats: 5,
    pricePerDay: 4900,
  },
  {
    id: 'taiga-lift',
    model: 'Тайга Лифт',
    class: 'suv',
    gearbox: 'manual',
    seats: 7,
    pricePerDay: 4300,
  },
];
