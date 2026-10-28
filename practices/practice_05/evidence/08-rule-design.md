# Шаги 7–8. Правило rules.design и проверка на draft fleet-filter-reset

## Сессия `07-propose-next` — основной чат

Промпт:

```text
/opsx:propose fleet-filter-reset
Цель: связанная с fleet-filtering фича — кнопка «Сбросить фильтр» в блоке фильтра автопарка: возвращает оба селекта в «любой», показывает все машины, счётчик «Показано 8 из 8». Кнопка неактивна (disabled), когда фильтр уже в состоянии по умолчанию. В пустом результате текст подсказки предлагает нажать «Сбросить фильтр».
Сохрани поведение из openspec/specs/fleet-filtering: отметка выбранной машины и #fleet-status не меняются при сбросе, список калькулятора полный. Только <button>, без <input> в #fleet.
Вне объёма: URL/localStorage, новые критерии отбора, сортировка.
Подготовь proposal, specs, design и tasks. Остановись до apply.
```

- session_id: `405eebb0-fecb-4aac-8b34-0b76561da86d`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (30):
  1. `Bash` openspec context --json 2>&1 | head -60
  2. `Bash` ls openspec/ openspec/specs/ openspec/changes/ 2>&1
  3. `Bash` cat openspec/config.yaml; echo ---; ls -R openspec/specs openspec/changes/archive; echo ---; cat openspec/specs/fleet-filtering/spec.md
  4. `Bash` ls -R src tests docs scripts 2>&1 | head -50
  5. `Bash` wc -l src/*.js tests/*.js index.html styles.css 2>/dev/null; echo ---; cat src/filter.js
  6. `Bash` cat src/main.js src/render.js
  7. `Bash` sed -n '/id="fleet"/,/<\/section>/p' index.html; echo === ; grep -n 'fleet' docs/requirements.md | head -40
  8. `Bash` cat tests/index.test.js; echo ===; cat scripts/check.sh
  9. `Bash` sed -n '/id="fleet"/,/id="calculator"/p' index.html
  10. `Bash` cat scripts/check.sh
  11. `Bash` grep -n -i "фильтр\|автопарк" docs/requirements.md
  12. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/requirements.md
  13. `Bash` grep -n 'id="fleet"' -A 40 index.html
  14. `Bash` grep -n 'fleet-filter' -A 12 styles.css | head -60
  15. `Bash` grep -n 'button\|disabled\|focus-visible\|--' docs/style-guide.md | head -60
  16. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/style-guide.md
  17. `Bash` cat tests/filter.test.js; echo ===; cat tests/contrast-mcp.test.js
  18. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/contrast-mcp.test.js
  19. `Bash` grep -n 'car__action' -A 25 styles.css | head -50
  20. `Bash` openspec new change "fleet-filter-reset" 2>&1; echo ---; openspec status --change "fleet-filter-reset" --json 2>&1
  21. `Bash` openspec instructions proposal --change "fleet-filter-reset" --json 2>&1
  22. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter-reset/proposal.md
  23. `Bash` openspec instructions specs --change "fleet-filter-reset" --json 2>&1 | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['instru …
  24. `Bash` openspec instructions specs --change "fleet-filter-reset" 2>&1
  25. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter-reset/specs/fleet-filtering/spec.md
  26. `Bash` openspec instructions design --change "fleet-filter-reset" 2>&1 | tail -70
  27. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter-reset/design.md
  28. `Bash` openspec instructions tasks --change "fleet-filter-reset" 2>&1 | tail -55
  29. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter-reset/tasks.md
  30. `Bash` openspec validate "fleet-filter-reset" 2>&1; openspec status --change "fleet-filter-reset" 2>&1
- итог: success, 31 ходов, 217 с

Ответ агента:

Готово: `openspec/changes/fleet-filter-reset/` — 4/4 артефакта, `openspec validate` зелёный.

**Артефакты**
- `proposal.md` — зачем нужен сброс, что меняется, затронутые файлы.
- `specs/fleet-filtering/spec.md` — дельта к существующей capability: 4 ADDED требования (сброс одним действием, `disabled` в состоянии по умолчанию, сброс не затрагивает выбор машины, фильтр без `<input>`) и 2 MODIFIED с полным текстом (пустой результат — вторая строка-подсказка; контракт `src/filter.js` — плюс `isFilterDefault` и `EMPTY_RESET_HINT`).
- `design.md` — сброс пишет в селекты и зовёт тот же `renderFleet()`; `disabled` считается внутри `renderFleet()` через чистый `isFilterDefault`; `<button type="button">`, не `<input type="reset">`; `disabled` оформляется токеном `--ink-2` (5.01:1 к `--paper`).
- `tasks.md` — 4 группы, тесты внутри своей группы: контракт в `filter.js` + тесты → разметка/стили + тесты `index.test.js` → поведение в `main.js` + браузерная проверка → приёмка.

**Два места, где я решил сам — проверь:**

1. **`EMPTY_MESSAGE` не меняется.** Его точный текст зафиксирован и в `docs/requirements.md:69`, и в `tests/filter.test.js`. Чтобы не ломать контракт и существующий тест, подсказка про сброс добавлена второй строкой — новая константа `EMPTY_RESET_HINT` («Или нажмите «Сбросить фильтр» — покажем весь автопарк»). Твоё «текст подсказки предлагает нажать «Сбросить фильтр»» выполняется, но двумя абзацами, а не одной переписанной строкой.

2. **Конфликт с контрактом.** `docs/requirements.md:78` прямо перечисляет «кнопка сброса фильтра» среди того, что **вне объёма фичи C**. Ты эту кнопку заказал, так что я спланировал её целиком, но правку документа в задачи не включил (AGENTS.md запрещает менять контракт без поручения) — она висит в `Workflow follow-up`. До этой правки `landing-check`/tester по `docs/requirements.md` будет считать кнопку лишней. Скажи, дописывать ли строку 78 — тогда это станет задачей в apply.

Артефакты готовы к ревью. Когда будешь готов — запусти `/opsx:apply`.

## Сессия `08-update-rule` — основной чат

Промпт:

```text
/opsx:update fleet-filter-reset
Перед правкой выполни в shell:
openspec instructions design --change fleet-filter-reset --json
Проверь в ответе моё актуальное правило из openspec/config.yaml.
Примени его к тому же фрагменту — design.md этого изменения; покажи предлагаемый diff.
Сохрани смысл и границы; правь только после моего подтверждения.
Код не меняй.
```

- session_id: `405eebb0-fecb-4aac-8b34-0b76561da86d`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (4):
  1. `Bash` openspec instructions design --change fleet-filter-reset --json 2>&1
  2. `Bash` openspec status --change "fleet-filter-reset" --json 2>&1
  3. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter-reset/design.md
  4. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/config.yaml
- итог: success, 5 ходов, 49 с

Ответ агента:

**Правило найдено.** В ответе `openspec instructions design --change fleet-filter-reset --json` поле `rules` теперь содержит:

```
"rules": ["Объясни взаимодействие диаграммой Mermaid."]
```

В `openspec/config.yaml:8-10` оно задано только для артефакта `design` (`rules.design`) — остальных артефактов не касается. Когда я писал `design.md`, этого правила в конфиге не было, поэтому диаграммы в документе нет.

**Предлагаемая правка — одна:** вставить диаграмму взаимодействия в начало `## Decisions`, перед первым решением. Смысл и границы документа не меняются: диаграмма излагает уже принятые решения (сброс входит в тот же `renderFleet()`, предикат живёт в `filter.js`, `#fleet-status` и список калькулятора не затрагиваются), новых решений не вводит.

**Diff `openspec/changes/fleet-filter-reset/design.md`:**

```diff
@@ -32,6 +32,36 @@
 ## Decisions
 
+### Взаимодействие при смене фильтра и при сбросе
+
+```mermaid
+sequenceDiagram
+    actor V as Посетитель
+    participant F as Блок фильтра .fleet-filter
+    participant M as src/main.js renderFleet()
+    participant P as src/filter.js — чистые функции
+    participant R as Реестр, шапка, счётчик
+
+    alt Смена признака
+        V->>F: change на селекте класса или коробки
+        F->>M: обработчик change вызывает renderFleet()
+    else Сброс
+        V->>F: click «Сбросить фильтр»
+        F->>M: обработчик click: оба селекта := FILTER_ANY
+        M->>M: тот же renderFleet(), второго пути вывода нет
+    end
+
+    M->>P: filterCars(cars, { carClass, gearbox })
+    P-->>M: отобранные машины в исходном порядке
+    M->>P: isFilterDefault({ carClass, gearbox })
+    P-->>M: фильтр в состоянии по умолчанию — да или нет
+
+    M->>R: строки машин либо EMPTY_MESSAGE + EMPTY_RESET_HINT
+    M->>R: fleetHead.hidden при пустом результате
+    M->>R: countLabel(shown, total) в своей области
+    M->>F: кнопке disabled по ответу isFilterDefault
+    M->>R: markChosen(chosenCarId) после перерисовки
+
+    Note over M,R: fleet-status и список машин калькулятора не затрагиваются
+```
+
 ### Сброс пишет в селекты и вызывает `renderFleet()`
 
 Обработчик кнопки присваивает обоим селектам `FILTER_ANY` и зовёт `renderFleet()` — ту же функцию, что и обработчик `change`.
```

Два замечания по диаграмме:
- В подписях узлов намеренно нет `#` (`#fleet`, `#fleet-status`, `#fleet-count`): в Mermaid `#` начинает entity-код и ломает рендер. Поэтому `.fleet-filter`, `fleet-status` и имена функций вместо id.
- Остальные артефакты (`proposal.md`, `specs/fleet-filtering/spec.md`, `tasks.md`) после этой правки остаются согласованными — правка ничего в них не затрагивает, и правило на них не распространяется.

Код не трогаю. Подтверди — запишу в `design.md`.

## Сессия `08b-confirm` — основной чат

Промпт:

```text
Подтверждаю — запиши диаграмму в design.md. Затем openspec validate fleet-filter-reset --strict. Код не меняй, apply не запускай.
```

- session_id: `405eebb0-fecb-4aac-8b34-0b76561da86d`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (3):
  1. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter-reset/design.md
  2. `Bash` openspec validate fleet-filter-reset --strict 2>&1; echo "exit=$?"
  3. `Bash` openspec validate fleet-filter-reset --strict 2>&1
- итог: success, 4 ходов, 19 с

Ответ агента:

**Записано.** Диаграмма вставлена в `openspec/changes/fleet-filter-reset/design.md` — новый подраздел `### Взаимодействие при смене фильтра и при сбросе` в начале `## Decisions`, ровно по показанному diff. Других правок нет.

**`openspec validate fleet-filter-reset --strict` → `Change 'fleet-filter-reset' is valid`** (без предупреждений).

Где стоит change:
- Все 4 артефакта `done`, план согласован: `proposal.md`, `specs/fleet-filtering/spec.md`, `design.md`, `tasks.md`.
- Правило `rules.design` из `openspec/config.yaml` теперь выполнено.
- Открытым остаётся решение по `docs/requirements.md:78` («кнопка сброса фильтра» в списке вне объёма фичи C) — зафиксировано в `proposal.md` (Impact) и в `tasks.md` (Workflow follow-up).

Код не менялся, apply не запускался. Следующий шаг — когда скажешь: `/opsx:apply`.
