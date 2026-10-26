# Шаг 3. Отдельный чат-ревьюер, затем /opsx:update

## Сессия `03-review` — отдельный чат-ревьюер

Промпт:

```text
Ты независимый ревьюер. Прочитай предложение OpenSpec fleet-filter (openspec/changes/fleet-filter/) и связанный код (index.html, src/, tests/, docs/requirements.md, AGENTS.md).
Проверь цель, допущения, ошибки и совместимость: совпадают ли данные спеки с src/cars.js (сколько машин каждого класса и коробки, есть ли пустые сочетания), выполнимы ли проверки в tasks.md в этом репозитории, не ломает ли план существующие тесты.
Покажи конкретные пробелы с доказательством (файл:строка или команда). Не требуй выдуманных ошибок — если пункт в порядке, так и скажи.
Файлы не меняй.
```

- session_id: `770d605a-4277-464f-96fa-f5702cadfe1a`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (27):
  1. `Bash` find /home/kulakva/Documents/ITMOv2/practices/practice_05/project -type f -not -path "*/.git/*" | sort
  2. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/proposal.md
  3. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/design.md
  4. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/tasks.md
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/specs/fleet-filtering/spec.md
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/cars.js
  7. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  8. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/render.js
  9. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/index.html
  10. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/index.test.js
  11. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/scripts/check.sh
  12. `Bash` sh scripts/check.sh 2>&1 | tail -20
  13. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/cars.test.js
  14. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/contrast-mcp.test.js
  15. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/requirements.md
  16. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/style-guide.md
  17. `Bash` grep -n "fleet\|field__control\|signal" styles.css | head -60
  18. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  19. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  20. `Bash` grep -n "@media" styles.css
  21. `Bash` node -e " import('./src/cars.js').then(({cars,CAR_CLASSES,GEARBOXES})=>{ const c={},g={}; for(const car of cars){c[car.class]=(c[car.class]| …
  22. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/calc.js
  23. `Bash` git status --short | head -5; echo "--- diff tests ---"; git diff --stat tests/ ; echo "(exit $?)"; echo "--- ls-files ---"; git ls-files |  …
  24. `Bash` git status --short
  25. `Bash` git ls-files -- . | wc -l
  26. `Bash` cat openspec/changes/fleet-filter/.openspec.yaml openspec/config.yaml package.json
  27. `Bash` grep -n "hidden" styles.css
- итог: success, 28 ходов, 204 с

Ответ агента:

Прочитал предложение целиком и сверил с кодом. Проверку запускал: 66 тестов зелёные.

## Что в порядке

**Данные спеки совпадают с `src/cars.js`.** Проверил пересчётом:

```
classes { economy: 2, comfort: 2, business: 2, suv: 2 }
gearboxes { manual: 3, automatic: 5 }
business manual 0   ← единственное пустое сочетание
```

`design.md:25` («economy 2, comfort 2, business 2, suv 2; manual 3, automatic 5… `business + manual` пусто») — точно. Все остальные 7 пар непусты, так что пустое сочетание действительно ровно одно, и формулировка «достижим обычным выбором» верна. Сценарий спеки «класс, под который подходят 2 машины из 8» (`spec.md:63`) работает для любого класса — все по 2. Сценарий «выход из пустого результата» даёт ровно 2 машины бизнес-класса (`tasks.md:27`) — верно.

**Обоснование `<select>` вместо `<input>` — не выдумка, а реальное ограничение.** `tests/index.test.js:104` и `:125` стартуют с первого `<input` в документе; сейчас это `calc-days` (`index.html:107`), первый `<input` в файле. `#fleet` (строка 67) выше `#calculator` (строка 90), поэтому `<input>` фильтра действительно подменил бы `aria-describedby` в блобе. Решение `design.md:53-64` корректно.

**Остальное сверенное:** `fleetHtml(list)` принимает произвольный список (`render.js:49`) — правки не нужны; `CLASS_LABELS`/`GEARBOX_LABELS` экспортированы (`cars.js:5,12`); `.fleet__head` лежит вне `#fleet-list` (`index.html:76` vs `:84`) — как и сказано; «прежние 66 тестов» (`tasks.md:38`) — ровно 66; проверка контраста `--ink-2`/`--paper` через MCP выполнима и уже покрыта (`tests/contrast-mcp.test.js:38`, 5.01:1 по `style-guide.md:19`).

## Пробелы

**1. Все проверки через `git diff` неисполнимы в этом репозитории.** Задачи 1.1, 3.2 и 6.1 проверяются командами `git diff docs/requirements.md`, `git diff index.html`, `git diff` по `tests/`. Но каталог проекта не отслеживается:

```
$ git status --short
?? ./
$ git ls-files -- . | wc -l
0
```

`git diff` даст пустой вывод при любом состоянии файлов — проверка не отличает успех от провала. Нужна другая формулировка (например, сверка с заранее снятой копией или явная проверка, что блоки «Фича A»/«Фича B» остались дословно).

**2. `design.md` и `tasks.md` расходятся в том, где живёт строка пустого результата.** `design.md:78`: «Сообщение о пустом результате пишется в `#fleet-list` тем же присваиванием `innerHTML`… один путь вывода, одно место, где может оказаться контент». `tasks.md:20` (3.2): «Добавить в `index.html` контейнер строки пустого результата». Это два разных решения — отдельный контейнер в разметке как раз вводит второе место, против которого аргументирует design. Один из двух пунктов надо убрать.

**3. Скрытие `.fleet__head` не описано, а наивные варианты ломаются.** `styles.css:242-244` задаёт `.fleet__head, .car { display: grid }` авторским правилом. Авторское правило в каскаде сильнее UA-правила `[hidden] { display: none }`, а своего `[hidden]` в `styles.css` нет (`grep hidden styles.css` → только `overflow: hidden` на строке 293). Значит `head.hidden = true` **не скроет шапку**. Обратная сторона: если скрывать через `style.display = 'none'`, то восстанавливать надо `style.display = ''`, а не `'grid'` — иначе сломается `styles.css:604-606` (`.fleet__head { display: none }` при `max-width: 60rem`), и шапка полезет на 360 px. Ни `design.md:76-78`, ни задача 4.3 этого не фиксируют, хотя это единственное место, где реализация может тихо разойтись со сценарием спеки.

**4. Задача 4.4 не учитывает второй источник отметки.** `main.js:89`: `carField?.addEventListener('change', () => markChosen(carField.value))` — отметка ставится не только по клику «Рассчитать», но и при смене машины в селекте калькулятора. Если id запоминать только в обработчике клика (как написано в 4.4 и `design.md:80-82`), то сценарий «сменил машину в калькуляторе → сменил фильтр» вернёт отметку на прежнюю строку. Переменную модуля надо обновлять в обоих местах; в задаче это не сказано.

**5. «Грид `.fleet`» — фактическая ошибка.** `tasks.md:33` (5.1) «блок лежит вне грида `.fleet`» и `design.md:88` «селекты кладутся вне грида реестра». `.fleet` гридом не является (`styles.css:235-240`: только `width`, `margin-left`, `border-top`); гриды — `.fleet__head` и `.car`. Намерение понятно, но исполнителю стоит дать точную формулировку: блок фильтра — сосед `div.fleet`, а не его ребёнок (иначе попадёт под `border-top` и отрицательный `margin-left: -0.75rem`, что как раз и есть риск горизонтального скролла из `design.md:88`).

**6. Разметка селектов и тексты спеки остаются без автотестов.** Задача 4.1 строит `<option>` в `main.js`, хотя в проекте вся генерация разметки — чистые функции в `render.js` под тестами (`render.js:60` `carOptionsHtml` + тест «в списке калькулятора по одному option на машину с ценой»), а `proposal.md:32` запрещает менять `render.js`. В результате текст счётчика «Показано N из M» и строка пустого результата — оба MUST в спеке (`spec.md:59,74`) — проверяются только вручную в браузере (задачи 4.2, 4.3). `tests/filter.test.js` покрывает лишь отбор. Это не ошибка плана, но заметная дырка в покрытии: достаточно было бы двух чистых функций форматирования в `src/filter.js` под тестами.

**7. Непокрытый сценарий: выбранная машина отфильтрована.** Спека покрывает только случай «машина осталась показанной» (`spec.md:116-119`). Если машину отфильтровали, `markChosen` безопасно промахнётся (`main.js:32`, опциональная цепочка), но `#fleet-status` сохранит «Выбрана Прима Седан — …» над реестром, где этой машины нет. Поведение приемлемое, но стоит решить явно, а не оставлять на реализацию.

**8. `requirements.md:14` требует «не меньше 6 карточек» в `#fleet`.** Пустой результат это нарушает буквально. Тест смотрит на данные (`tests/cars.test.js:5-8` — `cars.length >= 6`), так что ничего не упадёт, но при добавлении секции «Фича C» (задача 1.1) стоит оговорить, что критерий относится к состоянию по умолчанию.

## Про совместимость с тестами

Существующие тесты план не ломает, если соблюдено ограничение «ни одного `<input>` в `#fleet`». Отдельно проверил ещё два хрупких места, которые в `design.md` не упомянуты, и оба безопасны: `tests/index.test.js:148` (между `calc-days` и `calc-error` нет других полей) не затрагивается, так как фильтр стоит выше `calc-days`; `tests/index.test.js:153` (`!html.includes('data-car-id')`) не затрагивается, если в контейнер пустого результата не попадёт этот атрибут. Срез `#fleet` для теста из задачи 3.3 (`indexOf('id="fleet"')`) однозначен — `id="fleet-list"` и `id="fleet-status"` под эту строку не подходят.

## Сессия `03-update` — основной чат

Промпт:

```text
/opsx:update fleet-filter
Независимый ревьюер нашёл пробелы. Учти согласованные решения:
1. Проект не отслеживается git, поэтому проверки через `git diff` пустые. Базовая версия проекта — коммит a80c913 (ветка практики 4), путь practices/practice_04/project. Проверки «не тронуто» формулируй как `git show a80c913:practices/practice_04/project/<файл> | diff -u - <файл>`.
2. Строка пустого результата пишется в #fleet-list тем же innerHTML, отдельного контейнера в index.html нет (как в design). Убери противоречие в tasks 3.2.
3. Шапка скрывается атрибутом hidden; в styles.css добавить правило `.fleet__head[hidden] { display: none; }`, потому что авторское `display: grid` перебивает UA-стиль. Возврат — `hidden = false`, медиазапрос `max-width: 60rem` для шапки должен продолжать работать.
4. id выбранной машины в переменной модуля обновляется в обоих местах: клик «Рассчитать» и change селекта калькулятора.
5. Исправь формулировку: блок фильтра — сосед div.fleet, а не его ребёнок; .fleet не грид.
6. Разметку опций селектов, текст счётчика и строку пустого результата делаем чистыми функциями в src/filter.js (filterOptionsHtml, countLabel, EMPTY_MESSAGE) под тестами в tests/filter.test.js. render.js не меняем.
7. Если выбранная машина отфильтрована: отметки в реестре нет, #fleet-status не меняется (машина по-прежнему выбрана в калькуляторе). Добавь это сценарием в спеку.
8. В «Фиче C» оговорить, что критерий фичи A «не меньше 6 карточек» относится к состоянию фильтра по умолчанию.
Обнови артефакты, прогони openspec validate fleet-filter --strict, покажи diff по смыслу. Код не меняй, остановись до apply.
```

- session_id: `7012ef3d-372a-4022-8064-d545c75cfc9a`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (20):
  1. `Bash` openspec status --change "fleet-filter" --json 2>&1 | tail -45
  2. `Bash` git status --porcelain . 2>&1 | head -5; echo "=== ls-files ==="; git ls-files . 2>&1 | head -5; echo "(empty = untracked)"; echo "=== base  …
  3. `Bash` git show a80c913 --stat --oneline 2>&1 | head -3; echo "=== base files ==="; git ls-tree --name-only a80c913:practices/practice_04/project 2 …
  4. `Bash` git show a80c913:practices/practice_04/project/index.html 2>/dev/null | diff -u - index.html | head -5; echo "--- exit: $? (empty diff = ide …
  5. `Bash` git ls-tree --name-only a80c913:practices/practice_04/project
  6. `Bash` git ls-tree --name-only "a80c913:practices/practice_04/project"
  7. `Bash` grep -n "max-width\|fleet__head" styles.css
  8. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
  9. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/tasks.md
  10. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/specs/fleet-filtering/spec.md
  11. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/specs/fleet-filtering/spec.md
  12. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/design.md
  13. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/design.md
  14. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/design.md
  15. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/design.md
  16. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/proposal.md
  17. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/proposal.md
  18. `Edit` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/proposal.md
  19. `Bash` openspec validate "fleet-filter" --strict 2>&1
  20. `Bash` openspec status --change "fleet-filter" 2>&1 | tail -10
- итог: success, 21 ходов, 229 с

Ответ агента:

`openspec validate fleet-filter --strict` — valid, 4/4 артефакта. Код не менял.

## Diff по смыслу

| № | Правка | Где |
|---|---|---|
| 1 | Все проверки «не тронуто» переписаны на `git show a80c913:practices/practice_04/project/<файл> \| diff -u - <файл>`. В шапке `tasks.md` объяснено, почему: каталог untracked, `git diff` пуст. | tasks (шапка, 1.1, 1.3, 3.2, 6.1), design (Risks), proposal (Impact) |
| 2 | Противоречие убрано: 3.2 больше не добавляет контейнер, а требует **оставить** `#fleet-list` и `#fleet-status` без изменений — сообщение идёт в `#fleet-list` тем же `innerHTML`. | tasks 3.2, design (решение о пустом результате) |
| 3 | Шапка скрывается `hidden`; новая задача 5.2 добавляет `.fleet__head[hidden] { display: none; }` с причиной (авторский `display: grid` перебивает UA-стиль) и расчётом специфичности. | tasks 4.3, 5.2, design |
| 4 | Переменная модуля обновляется **в обоих** местах — клик «Рассчитать» и `change` селекта калькулятора. В design добавлено, что будет при обновлении только в одном. | tasks 4.4, design |
| 5 | «Вне грида `.fleet`» → «сосед `div.fleet`, не его ребёнок»; оговорено, что `.fleet` не грид, грид на `.fleet__head` и `.car`. | tasks 3.1, 5.1, design (Context, Risks) |
| 6 | `filterOptionsHtml`, `countLabel`, `EMPTY_MESSAGE` — в `src/filter.js` под тестами; новая задача 2.4, задачи 4.1–4.3 их потребляют. Отдельное решение в design: `render.js` не трогаем, чтобы не рисковать зелёными тестами A и B. | proposal, design, spec (контракт), tasks 2.4, 4.1–4.3 |
| 7 | Два новых сценария: выбранная машина отфильтрована (отметки нет, `#fleet-status` не меняется, в калькуляторе остаётся) и её возврат. Новая задача 4.5, прежняя 4.5 стала 4.6. | spec, design, proposal, tasks 4.5 |
| 8 | Новая задача 1.3: оговорка в «Фиче C», что «не меньше 6 карточек» — про состояние по умолчанию. | proposal, tasks 1.3 |

Группа 4 выросла с 5 задач до 6, группа 5 — с 2 до 3; всего отслеживаемых задач 18 вместо 16.

## Два уточнения, которые я добавил сам

- **Экранирование в `filterOptionsHtml`**: прогоняю подписи через `escapeHtml`, импортируя её из `render.js`. Сам `render.js` при этом не меняется — импорт его не правит. Подписи свои и безопасные, но отступать в новом коде от дисциплины `carRowHtml` незачем.
- **Побочное следствие точки 3**: ниже 60rem шапка и так скрыта медиазапросом, поэтому там переключение `hidden` визуально ничего не меняет. Это не поломка, но проверку 5.2 я сформулировал с учётом этого, чтобы при приёмке не искали несуществующий баг.

Если какое-то из них расходится с твоим замыслом — скажи, поправлю.

Артефакты готовы. Следующий шаг — `/opsx:apply`; запускать его сам не буду.
