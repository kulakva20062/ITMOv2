# Шаг 2. /opsx:propose fleet-filter

## Сессия `02-propose` — основной чат

Промпт:

```text
/opsx:propose fleet-filter
Цель: фильтр автопарка #fleet по классу и коробке передач.
Используй выводы explore и принятые решения:
1. Да, критерии добавляем в docs/requirements.md отдельной секцией «Фича C», A и B не трогаем (это задача apply, не сейчас).
2. Отдельный счётчик «Показано N из M» со своим role="status"; #fleet-status остаётся за выбором машины.
3. Пустой результат: строка «Под эти условия машин нет — выберите «Любой класс» или «Любая коробка»», шапка реестра скрыта. Кнопку сброса не делаем.
4. По умолчанию «Любой класс» / «Любая коробка», применение сразу по change, два <select>.
Зафиксируй 3–5 условий приёмки:
- выбор класса показывает только машины этого класса и счётчик «Показано N из 8»;
- класс и коробка сочетаются по И;
- пустая комбинация (например, бизнес + механика) показывает пустой экран без шапки;
- после фильтрации «Рассчитать» и отметка выбранной машины работают, список машин в калькуляторе полный;
- чистая filterCars(cars, { carClass, gearbox }) покрыта тестами; неизвестное значение фильтра — RangeError.
Ошибки: неизвестное значение класса/коробки в filterCars — RangeError с понятным текстом.
Сохрани согласованное прежнее поведение: по умолчанию видны все 8 машин в прежнем порядке, сценарии фич A и B и их тесты не меняются.
Укажи, что не входит в изменение: цена, места, поиск, сортировка, сброс кнопкой, URL/localStorage, фильтрация списка калькулятора.
Подготовь документы. Остановись до apply.
```

- session_id: `7012ef3d-372a-4022-8064-d545c75cfc9a`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (16):
  1. `Bash` openspec context --json 2>&1 | head -60
  2. `Bash` openspec new change "fleet-filter" 2>&1 | tail -20
  3. `Bash` openspec status --change "fleet-filter" --json 2>&1
  4. `Bash` openspec instructions proposal --change "fleet-filter" --json 2>&1
  5. `Bash` openspec list --specs 2>&1
  6. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/proposal.md
  7. `Bash` openspec instructions specs --change "fleet-filter" --json 2>&1
  8. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/specs/fleet-filtering/spec.md
  9. `Bash` openspec instructions design --change "fleet-filter" --json 2>&1 | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['instruction …
  10. `Bash` openspec instructions design --change "fleet-filter" --json 2>&1
  11. `Bash` grep -n "RangeError" -A2 src/calc.js
  12. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/design.md
  13. `Bash` openspec instructions tasks --change "fleet-filter" --json 2>&1
  14. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/tasks.md
  15. `Bash` openspec status --change "fleet-filter" 2>&1; echo "=== VALIDATE ==="; openspec validate "fleet-filter" 2>&1
  16. `Bash` openspec validate "fleet-filter" --strict 2>&1
- итог: success, 17 ходов, 230 с

Ответ агента:

Все 4 артефакта готовы, `openspec validate --strict` чистый. Код проекта не трогал — изменения только в `openspec/changes/fleet-filter/`.

## Изменение `fleet-filter`

`openspec/changes/fleet-filter/` — схема `spec-driven`, 4/4 артефакта.

| Артефакт | Что внутри |
|---|---|
| `proposal.md` | Зачем фильтр, что меняется, новая возможность `fleet-filtering`, затронутые файлы, явный список того, что вне объёма |
| `specs/fleet-filtering/spec.md` | 8 требований, 15 сценариев WHEN/THEN — поведенческий контракт |
| `design.md` | Технические решения с обоснованием и отвергнутыми альтернативами |
| `tasks.md` | 6 групп, 16 отслеживаемых задач, у каждой — способ проверки |

Возможность назвал `fleet-filtering`, а не `fleet-filter`: имя изменения и имя спеки совпадать не должны, иначе `openspec show` упирается в неоднозначность. Это первая спека в проекте — до сих пор `openspec list --specs` отдавал пусто.

## Твои решения зафиксированы так

1. **Фича C в требованиях** — это задачи 1.1–1.2 с явной проверкой, что диффом не задеты секции A и B. Сам файл не правил, это работа apply.
2. **Отдельный счётчик** — требование «Счётчик показанных машин», и в нём отдельный сценарий на то, что счётчик не затирает сообщение о выборе машины в `#fleet-status`.
3. **Пустой результат** — требование с двумя сценариями: вход в пустое состояние и выход из него (шапка возвращается). Кнопки сброса нет.
4. **Два `<select>`, применение по `change`** — в design это решение подпёрто причиной, а не вкусом: `<input>` в `#fleet` сломал бы разбор `aria-describedby` в `tests/index.test.js:126`, а править существующие тесты запрещает `AGENTS.md`. Задача 3.3 добавляет тест-сторож «в секции `#fleet` нет ни одного `<input>`», чтобы грабли не выстрелили повторно.

Все пять твоих условий приёмки разошлись по требованиям; сохранность прежнего поведения — отдельное требование «Отбор сохраняет прежние сценарии автопарка и калькулятора» (кнопка «Рассчитать», `data-chosen`, полный список в калькуляторе).

## Два места, где я добавил своё решение

- **`'any'` как значение «любой»**, а не пустая строка: пустая строка в коде неотличима от «значение не передали», и неизвестное значение могло бы тихо показать весь автопарк вместо `RangeError`.
- **Цвет пустого результата — `--ink-2`, не `--stamp`**: по style guide `--stamp` только для ошибок ввода, а пустой результат — не ошибка.

Если хотя бы одно из них расходится с тем, что ты имел в виду, скажи — поправлю артефакты через `/opsx:update`, это дешевле, чем переделывать после apply.

Документы готовы к ревью. Когда скажешь — `/opsx:apply`.
