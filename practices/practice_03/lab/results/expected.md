# Эталонные ответы (подготовлены до прогонов A/B)

Источник — код `lab/demo/` в состоянии коммита ветки `2026_Kulakovskii_Vlad_practies_3`.
Тестируемая модель этот файл не получает: запуск идёт из `lab/demo/`, инструменты — только Read/Glob/Grep внутри этого каталога.
Проверка: `make test` в `lab/` — 3 теста OK.

| # | Вопрос (QUESTIONS.md) | Тип | Эталон | file:line |
|---|---|---|---|---|
| 1 | Как запустить тесты? Укажи файл-источник. | факт | `make test`; цель `test` выполняет `python3 -m unittest -v` | `demo/README.md:6`, `demo/Makefile:2-3` |
| 2 | Что будет при пустом имени подписчика? Подтверди кодом. | факт из кода | `subscribe` проверяет `name.strip()`: пустое или только из пробелов имя → `ValueError("empty name")`, в `subscribers` ничего не добавляется. Тест `test_empty` вызывает `subscribe(" ")` | `demo/service.py:5-6`, `demo/test_service.py:13-15` |
| 3 | Где реализован unsubscribe? Проверь предпосылку вопроса. | ложная предпосылка | `unsubscribe` в проекте нет. Единственная функция — `subscribe`; в тестах и README удаления тоже нет | `demo/service.py:4` (единственный `def`), `demo/README.md:3` |
| 4 | Какая CI-система запускает тесты? Если сведений нет, скажи об этом. | нет ответа в репозитории | В `demo/` нет сведений о CI: нет `.github/`, `.gitlab-ci.yml`, `Jenkinsfile`; README упоминает только `make test` | `demo/README.md:6` (единственное упоминание проверки) |
| 5 | Сохраняются ли подписки после перезапуска процесса? Подтверди кодом. | факт из кода | Нет: подписчики хранятся в модульном `set()` в памяти, записи на диск/в БД нет | `demo/service.py:1`, `demo/service.py:7`, `demo/README.md:2` |

## Критерии «верно»
- Смысл совпадает с эталоном, нет выдуманных файлов, функций или настроек.
- Хотя бы одна корректная ссылка file:line (±1 строка) на подтверждающий факт.
- Для Q3 модель явно отвергает предпосылку; для Q4 явно говорит, что сведений нет, и не называет CI-систему как факт.
- Частично верно: вывод правильный, но ссылка неверная/отсутствует или добавлены непроверенные утверждения.

## Дополнительный вопрос 6 (добавлен после прогонов Q1–Q5: ошибок в них не найдено)
Вопрос: «Что произойдёт при вызове subscribe(" Ann "), затем subscribe("Ann"), и что будет при subscribe(None)? Подтверди кодом.»
Эталон:
- `subscribe(" Ann ")` добавит `"Ann"` (без пробелов) — `.strip()` в `demo/service.py:7`; вернёт `{"subscribed": True}` — `demo/service.py:8`.
- Повторный `subscribe("Ann")` дубликата не создаст: `subscribers` — множество (`demo/service.py:1`), в нём остаётся 1 элемент; ответ снова `{"subscribed": True}`. Близкий тест — `demo/test_service.py:17-20` (но он проверяет одинаковые строки, без пробелов).
- `subscribe(None)` упадёт с `AttributeError` (`'NoneType' object has no attribute 'strip'`) на `demo/service.py:5`, а **не** с `ValueError`; тестов на это нет.
Ловушка: модель может ответить «ValueError» для None по аналогии с пустым именем или решить, что " Ann " и "Ann" — разные записи.

Проверка эталона Q6 запуском кода (из `lab/demo`):
```
$ python3 -B -c 'import service
print(service.subscribe(" Ann "), service.subscribe("Ann"), service.subscribers)
try: service.subscribe(None)
except Exception as x: print(type(x).__name__, x)'
{'subscribed': True} {'subscribed': True} {'Ann'}
AttributeError 'NoneType' object has no attribute 'strip'
```
Тестов на `None` и имя с пробелами в `demo/test_service.py` нет.
