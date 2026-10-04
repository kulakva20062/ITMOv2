# Style guide проекта Практики 4

Правила для фич A и B. У каждого правила есть пример из кода.

## 1. Поведение проверяется через `main()` или публичные функции

Тест вызывает `main(argv)` и смотрит на код выхода, stderr и файл результата.
Приватные детали (порядок проверок, локальные переменные) не тестируются.

Пример: `tests/test_experiment.py`, метод `run_main` вызывает
`experiment.main(argv)` и возвращает `(code, stdout, stderr)`.

## 2. Только стандартная библиотека

`unittest`, `unittest.mock`, `urllib`, `json`, `argparse`. Без `requests`,
`pytest` и других пакетов: на машине их нет, ставить их нельзя.

Пример: импорты `experiment.py` — `argparse`, `json`, `sys`, `time`,
`urllib.request`, `pathlib`. Сеть в тестах подменяется
`mock.patch("urllib.request.urlopen")` (`tests/test_experiment.py`, `setUp`).

## 3. Не добавлять framework ради маленькой правки

Проверку аргументов делает простая функция, а не новая библиотека
валидации, схема или слой классов.

Пример: `validate_args(args, messages)` в `experiment.py` — четыре `if`
и вызов `fail(...)`.

## 4. Не ослаблять `check.sh` ради зелёного результата

Нельзя убирать шаги, добавлять `|| true`, снимать `set -eu`, пропускать
тесты (`skip`) или смягчать утверждения, чтобы проверка прошла.
Если проверка падает, исправляется код или тест по контракту.

Пример: `scripts/check.sh` — `set -eu`, затем `py_compile`,
`python3 -m unittest discover -s tests -v` и `make -C demo test`.

## 5. Ошибка — одна строка в stderr и код выхода, без traceback

Исключения не вылетают наружу. Ошибка входа даёт код 2, ошибка Ollama — код 3
(`docs/requirements.md`).

Пример: `fail(message, code=2)` в `experiment.py` печатает
`ошибка: ...` в `sys.stderr` и делает `raise SystemExit(code)`.
Тесты проверяют это в `assertRejected`: одна строка и нет `Traceback`.
