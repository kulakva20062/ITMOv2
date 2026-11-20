# Quickstart: проверить booking-api руками

**Дата**: 2026-10-23 · **План**: [plan.md](./plan.md) · **Контракт**: [`specs/contracts/booking-contract.md`](../contracts/booking-contract.md)

Этот файл — руководство по запуску и проверке, а не описание реализации. Формы тел и коды
смотреть в контракте §4–§9; фикстуры — в [data-model.md](./data-model.md).

## Предпосылки

- Node 24 (`node -v` → `v24.x`). Больше ничего: ни npm install, ни интернета.
- Работаем из корня проекта `practices/practice_05/project`.
- Все данные вымышленные: телефон `+7 000 000-00-00`.

## 1. Автоматическая проверка — главный критерий

```sh
sh scripts/check.sh
```

Должна быть зелёной после каждой правки (принцип III). Запускает `node --test
"tests/**/*.test.js"`: модульные тесты чистых функций и сквозные HTTP-тесты, которые сами
поднимают сервер на свободном порту — занятый 8000 им не мешает.

Отдельный файл при отладке:

```sh
node --test tests/booking.test.js
node --test tests/server.test.js
```

## 2. Запуск сервера

```sh
npm start          # == node server.js
```

Лендинг — `http://localhost:8000/`, API — `http://localhost:8000/api/**`, один процесс и один
origin (контракт §1). Остановка — Ctrl+C; вместе с процессом исчезают все заявки (контракт §11).

Проверка, что статика и API живут вместе:

```sh
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/styles.css
```

Оба — `200`.

## 3. Сценарии приёмки через curl

Даты в примерах — из фикстур; при ручной проверке подставляйте будущие даты, иначе получите
`date_past`.

### 3.1 Заявка принята (User Story 1)

```sh
curl -i -X POST http://localhost:8000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"carId":"larus-16","days":3,"extras":[],"name":"Иван Петров","phone":"+7 000 000-00-00","startDate":"2026-11-10"}'
```

Ожидаемо: `201`, заголовок `Location: /api/bookings/AD-0001`, в теле `id AD-0001`,
`status confirmed`, `endDate 2026-11-13`, `price.total 7200`, `customer.phone +70000000000`.
Сверить `price` с калькулятором лендинга для той же машины и срока — суммы должны совпасть
(SC-002).

### 3.2 Заявку видно по номеру

```sh
curl -i http://localhost:8000/api/bookings/AD-0001
curl -i http://localhost:8000/api/bookings/AD-9999
```

Ожидаемо: `200` с тем же телом и **без** `Location`; затем `404` с `booking_not_found`.

### 3.3 Повторная отправка не создаёт вторую бронь (User Story 4)

Повторить команду 3.1 без изменений.

Ожидаемо: `200`, тот же `id AD-0001`, `Location` нет, новая бронь не появилась (контракт §9).
Затем — то же тело, но с `extras` в другом порядке и пробелами в имени: по-прежнему `200` и
`AD-0001`.

### 3.4 Пересечение дат (User Story 2)

```sh
curl -i -X POST http://localhost:8000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"carId":"larus-16","days":2,"extras":[],"name":"Анна Смирнова","phone":"+7 000 000-00-00","startDate":"2026-11-12"}'
```

Ожидаемо: `409`, `error.code date_conflict`, обязательное
`conflict { carId: "larus-16", startDate: "2026-11-10", endDate: "2026-11-13" }` — ISO-даты
полуоткрытого интервала. Имени и телефона из чужой заявки в теле нет.

Встык — проходит:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"carId":"larus-16","days":1,"extras":[],"name":"Анна Смирнова","phone":"+7 000 000-00-00","startDate":"2026-11-13"}'
```

Ожидаемо: `201` — день возврата свободен (контракт §8).

Другая машина на те же даты — тоже `201`: правило действует в пределах одного `carId`.

### 3.5 Разбор ошибок по полям (User Story 3)

```sh
curl -i -X POST http://localhost:8000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"carId":"larus-16","days":0,"extras":[],"name":"A","phone":"123","startDate":"2026-11-10"}'
```

Ожидаемо: `400`, `error.code validation_failed`, в `fields` ровно три записи в порядке
`days`, `name`, `phone` с кодами `days_out_of_range`, `name_length`, `phone_invalid`.
Хранилище не изменилось — проверить `GET` следующего номера: его нет.

### 3.6 Транспортные отказы

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/bookings -d '{}'                     # 415
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/bookings -H 'Content-Type: application/json' -d ''   # 400 invalid_json
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE http://localhost:8000/api/bookings                            # 405 + Allow
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/api/unknown                                       # 404 not_found
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/api/cars/larus-16/busy                            # 404 — ручка вне объёма v1
```

Тело больше 8 КБ → `413`:

```sh
node -e 'process.stdout.write(JSON.stringify({carId:"larus-16",days:3,extras:[],name:"Иван",phone:"+7 000 000-00-00",startDate:"2026-11-10",pad:"x".repeat(9000)}))' > /tmp/big.json
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/bookings -H 'Content-Type: application/json' --data-binary @/tmp/big.json
```

### 3.7 Перезапуск теряет заявки

Ctrl+C, снова `npm start`, затем `curl -i http://localhost:8000/api/bookings/AD-0001`.

Ожидаемо: `404`, а следующая принятая заявка снова получает `AD-0001` (контракт §11).

## 4. Чек-лист приёмки фичи

- [ ] `sh scripts/check.sh` зелёный; тесты фич A, B, C по-прежнему проходят.
- [ ] Сценарии 3.1–3.7 дают ожидаемые коды и тела.
- [ ] Ни одного имени поля, кода ошибки или видимого текста вне контракта и модулей `src/` (SC-008).
- [ ] `price` в ответе совпадает с итогом калькулятора для тех же машины, срока и опций.
- [ ] В ответах нет HTML и стектрейсов; у всех ответов API — `Content-Type: application/json; charset=utf-8`.
- [ ] `src/calc.js` не изменён (`git diff --stat src/calc.js` пуст).
- [ ] Ни одной внешней зависимости: в `package.json` нет `dependencies` и `devDependencies`.
