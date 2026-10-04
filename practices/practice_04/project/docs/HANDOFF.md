# HANDOFF — проект Практики 4

## Текущее состояние

- Фича A (проверка входа до вызова LLM) реализована и принята студентом:
  коммит `a8a6682`. Существующий `--output`, `--temperature` вне [0, 2],
  пустое `--model` и промпт длиннее `MAX_PROMPT_CHARS = 7000` дают код 2
  и одну строку в stderr до HTTP-запроса.
- Фича B (ошибки Ollama) реализована в worktree `practice-04-b` и влита
  через `--ff-only`: коммит `986b979`. `--timeout` (конечное число > 0,
  по умолчанию 300); отказ соединения, таймаут, отсутствующая модель,
  прочие HTTP-ошибки и невалидный JSON дают код 3 и одну строку.
- Замечания review (tester) учтены: `--timeout nan/inf` отклоняется
  с кодом 2, добавлены тесты на `nan`/`inf` и на URL `/api/chat`.
- После независимой проверки: `--output` в несуществующий каталог или каталог
  без права записи отклоняется с кодом 2 до запроса (строки контракта и тесты
  добавлены).
- `sh scripts/check.sh`: 27 тестов `experiment.py` + 3 теста `demo/`, код 0.
- Домашнее задание: skill `.claude/skills/ollama-experiment/` (проверка Ollama,
  запуск `experiment.py`, сводка), stdio MCP-сервер `mcp/ollama_info_server.py`
  (tool `ollama_model_info`, зарегистрирован в `.mcp.json`; в `claude mcp list`
  оба MCP-сервера ✔ Connected), рефлексия `../reflection.md`, отчёт `../REPORT.html`.

## Источники

- Контракт: `docs/requirements.md`.
- Правила кода: `docs/style-guide.md`.
- Правила агента: `AGENTS.md` (через `CLAUDE.md`).
- Тесты: `tests/test_experiment.py`; пример стиля — `demo/test_service.py`.
- Среда Claude Code: skills `.claude/skills/test-driven-development/` и
  `.claude/skills/ollama-experiment/`, MCP-сервер `mcp/ollama_info_server.py`,
  MCP Context7 в `.mcp.json`, hook `.claude/settings.json` →
  `.claude/hooks/check-after-edit.sh`, субагент `.claude/agents/tester.md`.

## Команда проверки

```sh
sh scripts/check.sh        # из каталога project/
make step4                 # из корня репозитория
```

## Ограничения

- Только стандартная библиотека Python 3.10+; пакеты не ставить.
- Контракт и `check.sh` меняются только по поручению студента.
- `practices/practice_01..03` не трогать.
- Коммиты и слияние — только по команде студента, без `push`.

## Не проверено

- Отказ соединения, HTTP 500 и невалидный JSON проверены только моками
  `urlopen`, не на остановленной Ollama.
- Ответ Ollama с валидным JSON, но не объектом, не обрабатывается
  (контракт этого не описывает).

## Следующий шаг

Студент: закоммитить домашнее задание и открыть PR.
