# ДЗ. Две команды пишут спеки независимо

## Сессия `h1-team-ui` — КОМАНДА 1 — UI

Промпт:

```text
Общая задача продукта (одинакова для обеих команд): после расчёта в калькуляторе посетитель AutoDrive может отправить заявку на бронирование выбранной машины: имя, телефон, дата начала аренды; срок и опции берутся из калькулятора. Заявка уходит на сервер, сервер проверяет её, сам пересчитывает цену и отвечает номером заявки. Машина не может быть забронирована дважды на пересекающиеся даты. Хранение — в памяти процесса, без БД. Без авторизации, оплаты, e-mail/SMS.

Ты — КОМАНДА 1, отвечаешь только за UI. Вторая команда параллельно пишет спецификацию логики и API; её файлов в specs/ не читай и под неё не подстраивайся — расхождения разберём на согласовании.
/speckit-specify Спецификация UI заявки на бронирование (short-name: booking-ui): экраны и действия посетителя, поля формы и их подсказки, состояния (нет расчёта, заполнение, отправка, успех, ошибки полей, занятые даты, сервер недоступен), тексты ошибок, доступность (label, aria-invalid, role="status"), поведение на 360 и 1280 px. Какие данные UI отправляет и что ожидает получить — опиши со своей стороны, как предположения UI.
Остановись после спецификации (без plan).
```

- session_id: `b21e12b8-3ab5-4706-9fb6-ec1a955ab908`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (17):
  1. `Skill` speckit-specify
  2. `Bash` ls -a && echo "---extensions---" && cat .specify/extensions.yml 2>/dev/null || echo "NO extensions.yml" ; echo "---init-options---" && cat . …
  3. `Bash` ls -R docs src tests 2>/dev/null | head -50
  4. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/templates/spec-template.md
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/memory/constitution.md
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/requirements.md
  7. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  8. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/style-guide.md
  9. `Bash` awk '/id="calculator"/,/<\/section>/' index.html && echo "=== format.js ===" && cat src/format.js && echo "=== cars head ===" && head -20 sr …
  10. `Grep` calc-|calculator
  11. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/format.js
  12. `Bash` mkdir -p specs/001-booking-ui/checklists && cp .specify/templates/spec-template.md specs/001-booking-ui/spec.md && printf '{\n "feature_dire …
  13. `Bash` mkdir -p specs/001-booking-ui/checklists
  14. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/feature.json
  15. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/spec.md
  16. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/001-booking-ui/checklists/requirements.md
  17. `Bash` sh scripts/check.sh 2>&1 | tail -20
- итог: success, 19 ходов, 265 с

Ответ агента:

Спецификация готова. `sh scripts/check.sh` зелёный (86/86) — правок кода не было, только документы.

## Completion Report

- **SPECIFY_FEATURE_DIRECTORY**: `specs/001-booking-ui`
- **SPEC_FILE**: `specs/001-booking-ui/spec.md`
- Чеклист: `specs/001-booking-ui/checklists/requirements.md` — **16/16 пройдено с первой итерации**, маркеров `[NEEDS CLARIFICATION]` нет.
- Путь зафиксирован в `.specify/feature.json` для последующих команд.
- Extension hooks: `.specify/extensions.yml` отсутствует — до и после спецификации хуков не запускалось.

### Что в спецификации

- **3 истории по приоритету**: P1 — отправить заявку по готовому расчёту и получить номер; P2 — исправить ошибки полей и занятые даты; P3 — доступность и адаптивность. Каждая независимо тестируема.
- **42 функциональных требования** по шести группам: размещение/состав экрана, поля и подсказки, состояния, проверка ввода и тексты ошибок, доступность, поведение на 360/1280 px.
- **5 состояний как конечный автомат**: «нет расчёта» → «заполнение» → «отправка» → «успех» / «сервер недоступен». Ошибки полей и занятые даты сделаны признаками состояния «заполнение», а не отдельными состояниями — иначе автомат разрастается и переходы становятся непроверяемыми.
- **Тексты ошибок заданы дословно** (8 ошибок полей + занятые даты + недоступность сервера + нераспознанный отказ), без извинений, каждый говорит, что исправить — как требует `docs/style-guide.md`.
- **Доступность**: `label` на каждом поле, `aria-invalid` на поле с ошибкой, `role="alert"` на тексте ошибки поля (так предписывает style-guide), `role="status"` на области состояния формы.
- **14 граничных случаев**, включая сброс расчёта во время заполнения, двойное нажатие кнопки, расхождение итога с серверным и отключённый JavaScript.
- **Серверная сторона — только как предположения UI**: отдельный раздел `UI-REQ-01…07` (что отправляем) и `UI-RES-01…08` (что ожидаем), плюс 3 открытых вопроса к согласованию. Файлов второй команды в `specs/` не читал — их там и не было.

### Два решения, на которые стоит посмотреть при согласовании

1. **UI не отправляет суммы** (UI-REQ-06) — цену считает сервер, итог из калькулятора нужен только для показа и сравнения. Это следует из общей задачи («сервер сам пересчитывает цену»), но делает снимок расчёта чисто декоративным.
2. **Все формулировки принадлежат UI** (FR-028) — из ответа берём только номер заявки, сумму и границы занятого интервала, но не готовый текст. Если команда логики заложила в API текстовые сообщения для показа, это и будет первым расхождением.

Остановился на спецификации — `/speckit-plan` не запускал. Следующий шаг по готовности: `/speckit-clarify` (если хочешь закрыть 3 открытых вопроса до плана) или `/speckit-plan`.

## Сессия `h2-team-logic` — КОМАНДА 2 — логика

Промпт:

```text
Общая задача продукта (одинакова для обеих команд): после расчёта в калькуляторе посетитель AutoDrive может отправить заявку на бронирование выбранной машины: имя, телефон, дата начала аренды; срок и опции берутся из калькулятора. Заявка уходит на сервер, сервер проверяет её, сам пересчитывает цену и отвечает номером заявки. Машина не может быть забронирована дважды на пересекающиеся даты. Хранение — в памяти процесса, без БД. Без авторизации, оплаты, e-mail/SMS.

Ты — КОМАНДА 2, отвечаешь только за логику и API. Первая команда параллельно пишет спецификацию UI; её файлов в specs/ не читай и под неё не подстраивайся — расхождения разберём на согласовании.
/speckit-specify Спецификация логики заявки на бронирование (short-name: booking-api): данные заявки, правила проверки каждого поля, алгоритм пересчёта цены (переиспользовать правила src/calc.js), правило пересечения дат, хранение в памяти, HTTP API (метод, путь, тело запроса, коды ответа, тело ошибки), граничные значения. Что UI должен отправить и что получит — опиши со своей стороны, как предложение API.
Остановись после спецификации (без plan).
```

- session_id: `722cf9bc-199b-4bcb-a503-1c116cc321ca`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change', 'speckit-analyze', 'speckit-checklist', 'speckit-clarify', 'speckit-constitution', 'speckit-converge', 'speckit-implement', 'speckit-plan', 'speckit-specify', 'speckit-tasks', 'speckit-taskstoissues']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (13):
  1. `Skill` speckit-specify
  2. `Bash` ls -a /home/kulakva/Documents/ITMOv2/practices/practice_05/project; echo "---SPECIFY---"; ls -R /home/kulakva/Documents/ITMOv2/practices/pra …
  3. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/calc.js
  4. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/requirements.md
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/templates/spec-template.md
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/memory/constitution.md
  7. `Bash` cd /home/kulakva/Documents/ITMOv2/practices/practice_05/project; echo "--ext--"; cat .specify/extensions.yml 2>/dev/null || echo NONE; echo  …
  8. `Bash` cd /home/kulakva/Documents/ITMOv2/practices/practice_05/project; grep -n "id:\|pricePerDay\|class:" src/cars.js | head -40; node -e "console …
  9. `Bash` mkdir -p specs/002-booking-api/checklists && cp .specify/templates/spec-template.md specs/002-booking-api/spec.md && ls specs/002-booking-ap …
  10. `Bash` mkdir -p /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/002-booking-api/checklists
  11. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/002-booking-api/spec.md
  12. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/specs/002-booking-api/checklists/requirements.md
  13. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/.specify/feature.json
- итог: success, 15 ходов, 268 с

Ответ агента:

Спецификация готова. Хуков нет (`.specify/extensions.yml` отсутствует), plan не запускал — как просили.

**Файлы**
- `SPECIFY_FEATURE_DIRECTORY` — `specs/002-booking-api`
- `SPEC_FILE` — `specs/002-booking-api/spec.md`
- чек-лист — `specs/002-booking-api/checklists/requirements.md` (все пункты пройдены, 0 маркеров `[NEEDS CLARIFICATION]`)

**Ключевые решения, которые пойдут на согласование с командой 1**
- UI отправляет ровно 6 полей (`carId`, `days`, `extras`, `name`, `phone`, `startDate`); цену не отправляет вообще, присланная цена игнорируется.
- Цена считается вызовом существующего `calculateRental` из `src/calc.js` — правила не дублируются; ответ отдаёт те же шесть сумм.
- Занятость — полуоткрытый интервал `[startDate, startDate+days)`: день возврата свободен, встык можно, пересечение считается только в пределах одного `carId`.
- API: `POST /api/bookings` → `201` + `Location`; `400 validation_failed` со списком полей, `400 invalid_json`, `409 date_conflict`, `413`, `415`, `404`, `405`, `500`. Единое тело ошибки `{ error: { code, message, fields } }`. Плюс `GET /api/bookings/{id}` и `GET /api/cars/{carId}/busy`.
- 16 машинных кодов ошибок по полям, каждый с граничными значениями в таблицах (срок 0/1/6/7/13/14/30/31, дата −1/сегодня/+365/+366, имя 1/2/60/61, телефон 10/11/12 цифр, дубли опций, нумерация `AD-0001`).
- «Сегодня» — параметр функции, не обращение к часам: валидация остаётся чистой и тестируемой (принцип II конституции).

**Два момента, которые стоит знать**
1. Фиче нужен процесс Node (`node:http`), а `docs/requirements.md` и `package.json` описывают проект как статику через `python3 -m http.server`. Правку требований (фича D) и `package.json` я не делал — это контракт, меняется по поручению владельца. Зафиксировано в Assumptions.
2. Я перезаписал `.specify/feature.json` с `specs/001-booking-ui` на `specs/002-booking-api` — так предписывает команда, но файл общий: downstream-команды команды 1 (`/speckit-plan` и т.п.) теперь будут подхватывать мою фичу. Если команда 1 работает в этой же рабочей копии, им нужно будет указать свою директорию явно.

Открытая точка по транспорту одна: источник для CORS, если UI будет открываться с другого порта (FR-031).
