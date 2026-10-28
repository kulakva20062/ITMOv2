# Specification Quality Checklist: UI заявки на бронирование (booking-ui)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-23
**Перепроверено**: 2026-10-23 — после согласования контракта 1.0.0
**Feature**: [spec.md](../spec.md)
**Contract**: [booking-contract.md](../../contracts/booking-contract.md) v1.0.0

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — **с оговоркой, см. примечание 1**
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — **с оговоркой, см. примечание 1**
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
- [x] No implementation details leak into specification — **с оговоркой, см. примечание 1**

## Соответствие контракту

- [x] Ни одно требование не противоречит контракту 1.0.0
- [x] Таблицы контракта не дублируются — спецификация ссылается на §1–§12
- [x] Имена полей, кодов ошибок и состояний взяты только из контракта (принцип V)
- [x] Все три вопроса, открытые в первой редакции, закрыты решениями контракта
- [x] Затронутые сценарии приёмки и граничные случаи дописаны
- [x] Раздел «Вне объёма UI» согласован с §12 контракта

## Notes

1. **Про «No implementation details» — осознанное отступление, правки не требует.**
   После согласования спецификация намеренно называет конкретные имена: коды ошибок
   (`date_conflict`, `name_charset`, …), HTTP-коды (`201`, `409`, `415`), поля запроса и ответа
   (`carId`, `price.total`, `conflict.endDate`), модули (`src/booking.js`, `src/booking-text.js`,
   `src/format.js`) и атрибуты доступности (`aria-invalid`, `role="alert"`, `role="status"`).
   Причина — принцип V конституции: контракт объявлен единственным источником имён, и спецификация
   UI обязана говорить ровно теми же именами, иначе расхождение вернётся. Обобщённые формулировки
   («признак некорректности», «ошибка занятости») здесь были бы хуже: они допускают второе имя.
   Требования по-прежнему описывают **наблюдаемое поведение**, а не способ реализации: ни одно FR
   не предписывает структуру функций, порядок вызовов или разметку сверх атрибутов доступности.
   Для нетехнического читателя сохранены раздел «User Scenarios» и «Success Criteria», которые
   читаются без контракта.

2. **Серверная часть больше не описана как предположения UI.** Раздел «Предположения UI о данных»
   (UI-REQ-*, UI-RES-*) из первой редакции удалён: обмен согласован, и его описание — в контракте.
   На его месте раздел «Обмен данными (по контракту)» со ссылками на §3–§10.

3. **Открытых вопросов не осталось.** Решения: горизонт 365 суток (`BOOKING_HORIZON_DAYS`, §2);
   имя и телефон проверяются общим `validateBooking` на обеих сторонах (§3, §6); ключ идемпотентности
   в заголовке не вводится — действует идемпотентность по содержимому (§9).

4. **Отличия UI от «наивного» прочтения контракта, которые стоит проверить тестами** (все отражены
   в FR и сценариях): полуоткрытый интервал → в тексте показывается `addDays(conflict.endDate, -1)`
   (FR-025); отказ по `carId`/`days`/`extras` → состояние «нет расчёта», а не ошибка поля (FR-043);
   `200` и `201` → одинаково успех (FR-044); `error.message` не показывается никогда (FR-028, SC-011).

5. Итерация валидации: 1 из 3. Все пункты пройдены, дополнительных правок спецификации не потребовалось.
