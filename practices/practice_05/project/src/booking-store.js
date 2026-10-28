// Хранилище заявок в памяти процесса: база данных и файлы не используются (контракт §11).
// Все операции синхронные — на этом держится неделимость «проверил занятость -> записал».
// Правило пересечения живёт в src/booking.js, поиск конфликта — в server.js: хранилище
// отдаёт только интервалы (контракт §3 и §11).

const ID_PREFIX = 'AD-';
const ID_MIN_DIGITS = 4;

function sameExtras(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const sorted = [...right].sort();
  return [...left].sort().every((extra, index) => extra === sorted[index]);
}

// Ключ повторной отправки по контракту §9: сравниваются уже нормализованные значения.
function matchesKey(booking, key) {
  return (
    booking.carId === key.carId &&
    booking.startDate === key.startDate &&
    booking.days === key.days &&
    booking.customer.name === key.name &&
    booking.customer.phone === key.phone &&
    sameExtras(booking.extras, key.extras)
  );
}

export function createStore() {
  const bookings = [];
  let counter = 0;

  return {
    // Кладёт заявку и присваивает номер. Счётчик растёт только здесь:
    // отказы и повторные отправки номер не расходуют.
    add(draft, now) {
      counter += 1;
      const booking = {
        id: `${ID_PREFIX}${String(counter).padStart(ID_MIN_DIGITS, '0')}`,
        status: 'confirmed',
        carId: draft.carId,
        startDate: draft.startDate,
        endDate: draft.endDate,
        days: draft.days,
        extras: [...draft.extras],
        customer: { name: draft.name, phone: draft.phone },
        price: { ...draft.price },
        createdAt: now,
      };

      bookings.push(booking);
      return booking;
    },

    findById(id) {
      return bookings.find((booking) => booking.id === id);
    },

    findSame(key) {
      return bookings.find((booking) => matchesKey(booking, key));
    },

    // Занятые интервалы одной машины, по возрастанию даты начала:
    // первый пересекающийся интервал попадёт в поле conflict ответа 409.
    intervalsFor(carId) {
      return bookings
        .filter((booking) => booking.carId === carId)
        .map((booking) => ({ startDate: booking.startDate, endDate: booking.endDate }))
        .sort((left, right) => (left.startDate < right.startDate ? -1 : 1));
    },

    // Возвращает хранилище в состояние «после старта процесса». Нужна тестам.
    clear() {
      bookings.length = 0;
      counter = 0;
    },
  };
}

// Экземпляр для сервера, запущенного как процесс. Тесты создают свой через createStore().
export const store = createStore();
