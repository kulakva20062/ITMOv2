# Implementation Plan: Логика и API заявки на бронирование

**Branch**: `2026_Kulakovskii_Vlad_practies_5` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-booking-api/spec.md`

**Контракт (источник имён)**: [`specs/contracts/booking-contract.md`](../contracts/booking-contract.md) v1.0.0

## Summary

Добавляем серверную сторону заявки на бронирование: чистые функции проверки, дат и
хранения в `src/booking.js` и `src/booking-store.js`, HTTP-слой в `server.js` в корне,
который на порту 8000 отдаёт и статику лендинга, и `/api/**`. Цена считается
существующим `calculateRental` из `src/calc.js` без правок этого модуля. Имена полей,
коды ошибок и форма тел — из контракта; спецификация задаёт поведение, план — расклад
по модулям и порядок проверок.

Технический подход: один процесс Node 24 на встроенных модулях. `server.js` экспортирует
фабрику сервера и слушает порт только при прямом запуске, поэтому сквозные HTTP-тесты
поднимают тот же сервер на свободном порту (`listen(0)`) и ходят в него через глобальный
`fetch`. Вся логика, зависящая от времени, получает «сегодня» и `createdAt` параметрами —
чистые функции к часам не обращаются.

## Technical Context

**Language/Version**: JavaScript (ES-модули), Node 24.19 — браузер для `src/` без `node:`-импортов

**Primary Dependencies**: нет. Только встроенные модули: `node:http`, `node:fs` (+ `node:fs/promises`), `node:path`, `node:url`, `node:test`, `node:assert/strict`

**Storage**: память процесса — массив заявок и счётчик номеров в `src/booking-store.js`. БД, файлов и внешних сервисов нет

**Testing**: `node --test "tests/**/*.test.js"` через существующий `sh scripts/check.sh`; модульные тесты чистых функций + сквозные HTTP-тесты, поднимающие сервер на свободном порту

**Target Platform**: Linux/macOS с одним Node 24, без сети; страница открывается на `http://localhost:8000/`

**Project Type**: статический лендинг + маленький HTTP API в одном процессе

**Performance Goals**: ответ ≤ 2 с на любой запрос (контракт §10) — при хранилище в памяти достигается с запасом

**Constraints**: тело запроса ≤ 8 КБ; проверка занятости и запись — без `await` между ними; `src/calc.js` не меняется; `src/booking.js` импортируется и в браузер, и в Node

**Scale/Scope**: демонстрационная нагрузка — один посетитель, единицы заявок; 3 новых модуля `src/`, 1 файл сервера, 4 файла тестов

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Гейт | Статус до Phase 0 | Статус после Phase 1 |
|---|---|---|---|
| I. Чистый стек без зависимостей (NON-NEGOTIABLE) | `package.json` без `dependencies`/`devDependencies`; серверный код только на встроенных модулях Node 24; раннер — `node --test` | PASS — план не вводит ни одного пакета | PASS — в Phase 1 использованы только `node:http`, `node:fs`, `node:path`, `node:url`, `node:test` |
| II. Логика — чистые функции в `src/` под тестами | расчёт, проверка, даты и хранение — в `src/`, без DOM, сети, часов и случайности; тексты — из `src/`, UI их не дублирует | PASS — «сегодня» и `createdAt` передаются параметрами; к часам обращается только `server.js` и `todayUtc()` как явный аксессор | PASS — см. `contracts/internal-modules.md`: все предикаты принимают `today`/`now`; хранилище — единственный модуль с состоянием, и оно изолировано за операциями §3 |
| III. Зелёный `scripts/check.sh` после каждой правки (NON-NEGOTIABLE) | раннер проходит после каждого шага; существующие тесты не ослабляются | PASS — `scripts/check.sh` не меняется, его glob `tests/**/*.test.js` подхватывает новые файлы | PASS — порядок задач в `/speckit-tasks` строится так, чтобы раннер был зелёным после каждой задачи |
| IV. Только вымышленные данные, никаких внешних ресурсов | заглушки `+7 000 000-00-00`, `hello@example.com`; никаких внешних CDN, шрифтов, картинок | PASS — тесты используют заглушку телефона из `AGENTS.md`; сервер не обращается в сеть | PASS — фикстуры в `data-model.md` и `quickstart.md` только с вымышленными данными |
| V. Контракт до кода — единственный источник имён (NON-NEGOTIABLE) | имена полей, коды, состояния и тексты — из контракта; код не вводит своих | PASS — контракт согласован 2026-10-23, спека к нему приведена | PASS — Phase 1 добавляет только внутренние сигнатуры функций, не упомянутые в контракте, и ни одного нового имени поля, кода или видимого текста |

Нарушений нет, раздел «Complexity Tracking» не заполняется. Два места требуют внимания и
разрешены заранее:

- `package.json` (`scripts.start` → `node server.js`) и `docs/requirements.md` (секция «Фича D»)
  правятся на этапе реализации. AGENTS.md запрещает менять контракт в `docs/requirements.md`
  «без поручения» — поручение есть: контракт §1 фиксирует эти правки как разрешённые владельцем.
- `src/format.js` получает `formatDate` (контракт §3). Это общий для двух команд модуль;
  владение закреплено за командой 2 — см. research.md, решение R-10.

## Project Structure

### Documentation (this feature)

```text
specs/002-booking-api/
├── spec.md                        # Что и зачем (готово)
├── plan.md                        # Этот файл
├── research.md                    # Phase 0: решения по реализации
├── data-model.md                  # Phase 1: сущности, инварианты, фикстуры
├── quickstart.md                  # Phase 1: как поднять и проверить вручную
├── contracts/
│   ├── README.md                  # Куда смотреть: внешний контракт vs внутренние сигнатуры
│   └── internal-modules.md        # Phase 1: сигнатуры и формы возврата модулей src/
├── checklists/
│   └── requirements.md            # Качество спеки (готово)
└── tasks.md                       # Phase 2 (/speckit-tasks — не создаётся планом)

specs/contracts/booking-contract.md # Согласованный контракт двух команд (не трогаем)
```

### Source Code (repository root)

```text
server.js                  # НОВЫЙ. HTTP-слой: роутинг /api/**, статика, коды ответов.
                           # Экспортирует createBookingServer(); слушает 8000 только при прямом запуске.

src/
├── booking.js             # НОВЫЙ. Чистые функции: validateBooking, overlaps, addDays,
│                          # todayUtc, isValidName, normalizePhone, ERROR_CODES,
│                          # BOOKING_HORIZON_DAYS. Без node:-импортов — работает и в браузере.
├── booking-store.js       # НОВЫЙ. Хранилище в памяти: add, findById, findSame,
│                          # intervalsFor, clear. Единственное состояние фичи.
├── format.js              # ПРАВИМ: + formatDate(iso) -> 'ДД.ММ.ГГГГ'. formatPrice не трогаем.
├── calc.js                # НЕ МЕНЯЕТСЯ. Источник цены, MIN_DAYS/MAX_DAYS, EXTRA_OPTIONS.
├── cars.js                # НЕ МЕНЯЕТСЯ. Источник carId и прайса.
├── booking-text.js        # ОБЪЁМ КОМАНДЫ 1. Видимые строки формы. Мы его не создаём.
├── filter.js, render.js, main.js   # НЕ МЕНЯЮТСЯ этой фичей.

tests/
├── booking.test.js        # НОВЫЙ. Таблицы граничных значений спеки: поля, даты, overlaps, ключ §9.
├── booking-store.test.js  # НОВЫЙ. Нумерация, findSame, intervalsFor, clear, изоляция состояния.
├── server.test.js         # НОВЫЙ. Сквозные HTTP: коды 201/200/400/404/405/409/413/415, форма тел.
├── format.test.js         # ПРАВИМ: + тесты formatDate.
└── calc.test.js, cars.test.js, filter.test.js, render.test.js, index.test.js, contrast-mcp.test.js
                           # НЕ МЕНЯЮТСЯ. Должны остаться зелёными.

package.json               # ПРАВИМ: scripts.start -> node server.js (разрешено контрактом §1).
docs/requirements.md       # ПРАВИМ: + секция «Фича D» со ссылкой на контракт (разрешено §1).
scripts/check.sh           # НЕ МЕНЯЕТСЯ.
index.html, styles.css     # ОБЪЁМ КОМАНДЫ 1. Сервер отдаёт их как есть.
```

**Structure Decision**: сохраняем плоскую раскладку проекта — чистые функции в `src/`,
тесты в `tests/`, один файл сервера в корне. Каталоги `models/`, `services/`, `api/` не
вводим: фича добавляет три модуля, и папочная иерархия на таком объёме только удлинила бы
пути импорта. Разделение «чистое/грязное» проходит по границе `src/` ↔ `server.js`, как
требует принцип II и контракт §1. Хранилище вынесено в отдельный модуль, потому что это
единственное состояние фичи, и тестам нужна операция `clear` для изоляции.

## Complexity Tracking

Нарушений Constitution Check нет — раздел не заполняется.
