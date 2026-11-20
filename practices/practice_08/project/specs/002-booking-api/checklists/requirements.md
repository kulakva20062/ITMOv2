# Specification Quality Checklist: Логика и API заявки на бронирование

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-23
**Re-checked**: 2026-10-23 — после согласования контракта `specs/contracts/booking-contract.md` v1.0.0
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Contract Alignment (добавлено при перепроверке)

Проверка каждого раздела контракта на наличие в спецификации и на отсутствие расхождений:

- [x] §1 один origin, порт 8000, `server.js` в корне → FR-027, FR-036, US1-8; CORS снят (FR-031)
- [x] §2 UTC, `todayUtc()`, `BOOKING_HORIZON_DAYS` в одном месте → FR-006, FR-009, граничные значения даты
- [x] §3 состав модулей `src/` и их экспорты → FR-004, FR-011, FR-019, FR-034, FR-038
- [x] §4 поля запроса, игнорирование лишних, лимит 8 КБ → FR-001, FR-002, FR-005, FR-030, US1-5
- [x] §5 тела `201`/`200`/ошибок, порядок `fields`, таблица кодов, ручки v1 → FR-003, FR-013, FR-024, FR-025, FR-026, FR-028
- [x] §6 правило телефона → FR-011; таблица значений не дублируется, стоит ссылка
- [x] §7 каталог кодов и текстов UI → FR-005, FR-008, FR-038, SC-005, FR-037
- [x] §8 полуоткрытый интервал, `overlaps`, последний занятый день считает UI → FR-018…FR-022, US2
- [x] §9 повторная идентичная заявка → `200` до правила пересечения → FR-015…FR-017, US4, таблица повторной отправки
- [x] §10 бюджет ≤ 2 с → FR-031, SC-007
- [x] §11 хранение в памяти, перезапуск → FR-032…FR-035
- [x] §12 вне объёма v1 (busy-ручка, `Idempotency-Key`, CORS, правки `src/calc.js`, статусы, лимит хранилища) → раздел «Обзор», FR-012, FR-026, FR-031
- [x] §13 проверяемость → FR-036, FR-037, SC-010
- [x] Спецификация не вводит ни одного имени поля, кода ошибки или текста вне контракта
- [x] Нумерация FR сохранена: ссылка контракта §1 на «FR-036 спецификации логики» по-прежнему указывает на требование о чистых функциях в `src/` и HTTP-слое в `server.js`

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- **Осознанное отступление от «No implementation details»**: задание прямо требует описать
  HTTP API (метод, путь, тело, коды ответа, тело ошибки) и переиспользование правил
  `src/calc.js`, а контракт фиксирует имена модулей `src/` как общий источник для двух
  команд. Поэтому в спецификации присутствуют пути, коды HTTP и имена модулей. Это предмет
  фичи, а не утечка реализации: *как* устроены валидатор, хранилище и HTTP-слой внутри,
  спецификация не предписывает — это объём `/speckit-plan`.
- Второе такое отступление — упоминание Node 24 и встроенных модулей в FR-036: ограничение
  задано конституцией (принцип I) и контрактом §1, а не выбрано этой спецификацией.
- **Открытых вопросов не осталось.** Прежняя единственная открытая точка — источник для
  CORS — закрыта контрактом §1: UI и API на одном origin, CORS и `OPTIONS` вне объёма v1.
- **Зависимость от правок вне этой фичи**: `package.json` (`scripts.start`) и
  `docs/requirements.md` (секция «Фича D») правятся на этапе реализации с разрешения
  владельца (контракт §1). Спецификация их не меняет; зафиксировано в Assumptions.
- Коды полей в каталоге контракта §7 — 16 штук (`required`, `car_unknown`,
  `days_not_integer`, `days_out_of_range`, `extras_not_array`, `extra_unknown`,
  `extras_duplicate`, `name_length`, `name_charset`, `phone_charset`, `phone_invalid`,
  `date_format`, `date_invalid`, `date_past`, `date_too_far`, `date_conflict`);
  SC-005 требует достижимости каждого.
