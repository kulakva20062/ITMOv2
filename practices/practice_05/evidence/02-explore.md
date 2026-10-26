# Шаг 1. /opsx:explore — исследование фичи «фильтр автопарка»

## Сессия `01-explore` — основной чат

Промпт:

```text
/opsx:explore
Хочу небольшую фичу для лендинга AutoDrive: фильтр существующего автопарка (#fleet) по классу автомобиля и коробке передач.
Прочитай затронутый код и существующие тесты.
Что уже есть? Что спорно или лишнее?
Найди команду проверки и запусти baseline.
Предложи узкие границы и вопросы для меня.
Код пока не меняй.
```

- session_id: `7012ef3d-372a-4022-8064-d545c75cfc9a`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (19):
  1. `Bash` ls -la && echo "---" && openspec list --json 2>&1 | head -40
  2. `Bash` find . -path ./.git -prune -o -type f -print | head -60
  3. `Bash` for f in docs/requirements.md src/cars.js src/render.js src/main.js scripts/check.sh openspec/config.yaml; do echo "=== $f ==="; cat -n "$f" …
  4. `Bash` for f in tests/cars.test.js tests/render.test.js tests/index.test.js; do echo "=== $f ==="; cat -n "$f"; done
  5. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/docs/requirements.md
  6. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/cars.js
  7. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/render.js
  8. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/src/main.js
  9. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/index.test.js
  10. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/render.test.js
  11. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/tests/cars.test.js
  12. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/scripts/check.sh
  13. `Bash` sed -n '1,80p' index.html
  14. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/config.yaml
  15. `Bash` sed -n '80,135p' index.html
  16. `Bash` sh scripts/check.sh 2>&1 | tail -25
  17. `Bash` grep -n "fleet\|data-chosen\|\.car" styles.css | head -50
  18. `Bash` sed -n '1,60p' docs/style-guide.md
  19. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/styles.css
- итог: success, 20 ходов, 103 с

Ответ агента:

Baseline зелёный: **66 тестов, 66 pass, 0 fail** (`sh scripts/check.sh` — единственный runner, `node --test "tests/**/*.test.js"`). OpenSpec: root есть, активных изменений и спеков нет.

---

## Что уже есть

Хорошая новость: словарь фильтра уже написан, а шов для него уже прорезан.

```
src/cars.js                     src/render.js                    src/main.js
+--------------------------+    +------------------------+       +-------------------------+
| CAR_CLASSES  [4]         |    | fleetHtml(list)        |<------| list.innerHTML =        |
| GEARBOXES    [2]         |--->|   list.map(carRowHtml) |       |   fleetHtml(cars)       |
| CLASS_LABELS {ru}        |    |   * чистая, без DOM    |       |   * вызов ровно один раз|
| GEARBOX_LABELS {ru}      |    +------------------------+       +-------------------------+
| cars [8]                 |                                                 |
+--------------------------+                              #fleet-list (пустой div в HTML)
                                                          #fleet-status role="status"
```

- `fleetHtml` **уже принимает произвольный список** — ей всё равно, полный он или отфильтрованный. Ничего переписывать не нужно, нужен только источник списка.
- `CLASS_LABELS` / `GEARBOX_LABELS` с русскими подписями уже есть — опции фильтра берутся оттуда, новых данных не завожу.
- `#fleet-status` с `role="status"` уже в разметке.
- Фильтра нет нигде: ни модуля, ни тестов, ни разметки.
- В автопарке 8 машин: economy 2, comfort 2, business 2, suv 2; manual 3, automatic 5. Все 8 пар класс×коробка покрыты не полностью — например, `business + manual` пусто. **Пустой результат достижим легальным выбором**, это не крайний случай, а обычный путь.

## Что спорно или рискованно

**1. `<input>` в секции `#fleet` взорвёт тесты калькулятора.** Это самое важное. `tests/index.test.js:104` и `:126` ищут поле срока по всему документу нежадным регулярным выражением:

```js
html.match(/<input[\s\S]*?id="calc-days"[\s\S]*?\/>/)   // стартует с ПЕРВОГО <input> в файле
//  ...
const describedBy = field.match(/aria-describedby="([^"]+)"/)?.[1]  // первое совпадение в блобе
```

`#fleet` стоит выше `#calculator`, поэтому любой `<input>` фильтра (радиокнопки, чекбоксы) попадёт в начало этого блоба, и `aria-describedby` подхватится **от фильтра, а не от поля срока** — тест упадёт. Вывод, а не вопрос: **фильтр делаем на двух `<select>`**, тогда регулярки не трогаем и контракт тестов не ослабляем (AGENTS.md это запрещает). Заодно `<select>` совпадает с `.field__control` калькулятора — style guide соблюдён без нового CSS-языка.

**2. `#fleet-status` — одна живая область на две фичи.** Сейчас туда пишет выбор машины: `Выбрана Прима Седан — …`. Если туда же писать `Показано 3 из 8`, сообщения будут затирать друг друга, и скринридер прочитает последнее. Либо отдельный `role="status"` для счётчика, либо одно объединённое сообщение. Нужно решить, а не оставить на самотёк.

**3. `data-chosen` теряется при перерисовке.** `markChosen` вешает атрибут на DOM-узел; `list.innerHTML = …` его сносит. После каждой фильтрации отметку выбранной машины надо проставлять заново (или мы молча ломаем связку «Рассчитать» → калькулятор).

**4. Шапка реестра при пустом результате.** `.fleet__head` — отдельный `aria-hidden="true"` грид на 6 колонок, живущий вне `#fleet-list`. При нулевом результате останется висеть «Модель / Класс / Коробка / …» над пустотой. Нужен явный пустой экран.

**5. Лишнего в коде я не нашёл.** Единственное, что выглядит избыточно: `daysLabel` в `render.js:56` с комментарием про склонения, который ничего не склоняет. К фильтру не относится, трогать не предлагаю.

## Узкие границы, которые я предлагаю

```
В ОБЪЁМЕ                                  ВНЕ ОБЪЁМА
+---------------------------------------+ +--------------------------------------+
| src/filter.js: чистая                 | | фильтр по цене, местам, модели       |
|   filterCars(cars, {carClass,gearbox})| | поиск текстом                        |
|   'all' / пусто = без ограничения     | | сортировка                           |
| tests/filter.test.js                  | | URL-состояние, ?class=suv            |
| 2 <select> в #fleet + пустой экран    | | localStorage, запоминание выбора     |
| перерисовка fleetHtml(filtered)       | | фильтрация <select id="calc-car">    |
| восстановление data-chosen            | |   (тест render.test.js:56 требует    |
| счётчик «показано N из 8»             | |    option на КАЖДУЮ машину)          |
| тесты разметки в index.test.js        | | анимации появления строк             |
+---------------------------------------+ +--------------------------------------+
```

Логика — чистой функцией в `src/` под тестами, как требует AGENTS.md; DOM-слой в `main.js` остаётся тонким. Это продолжение уже существующего устройства, а не новый подход.

## Вопросы к тебе

1. **`docs/requirements.md` — дописываем «Фичу C»?** AGENTS.md запрещает менять контракт без поручения, но фильтр без критериев приёмки нечем принимать, и `landing-check` сверяется именно с этим файлом. Моя рекомендация: да, отдельная секция «Фича C», существующие A и B не трогаем.

2. **Что в живой области при фильтрации** — отдельный счётчик рядом с селектами, или одно сообщение в `#fleet-status`, которое поглощает и выбор машины («Показано 3 из 8. Выбрана Прима Седан»)? Я за отдельный счётчик: две фичи не делят одно поле.

3. **Поведение при пустом результате** (например, бизнес + механика): показать строку «Под эти условия машин нет — сбросьте фильтр» и спрятать шапку реестра? Или ещё и кнопку «Сбросить»? Кнопка — это третий контрол и +1 к объёму; я бы начал без неё, достаточно вернуть селект в «любой».

4. **Фильтр по умолчанию и реакция** — оба селекта в «Любой класс» / «Любая коробка», применение сразу по `change` без кнопки «Применить»? Так ведёт себя остальная страница, и это меньше разметки.

Код не менял. Когда ответишь на 1–4 (или скажешь «бери свои рекомендации»), это ляжет в change через `/opsx:propose` — там и появятся proposal, спека и задачи.
