---
name: ollama-experiment
description: Use when asked to run the local Ollama experiment (experiment.py) and report decode speed, load time and the model's answer, or to check that Ollama is up and the model is pulled.
---

# Ollama experiment

Процедура запуска `experiment.py` проекта Практики 4 и короткая сводка результата.

## Шаги

1. Из каталога `project/` запусти скрипт skill:

   ```sh
   python3 .claude/skills/ollama-experiment/scripts/run_experiment.py --mode system
   ```

   Параметры: `--mode baseline|system` (обязателен), `--model` (по умолчанию
   `qwen3.8:27b`), `--temperature`, `--seed`, `--timeout`, `--output`
   (по умолчанию — новый файл во временном каталоге, чтобы не засорять репозиторий).

2. Скрипт сам делает три шага:
   - **проверка Ollama**: `GET http://127.0.0.1:11434/api/tags`, есть ли модель
     в списке скачанных. Если Ollama недоступна или модели нет — печатает
     понятную причину и всё равно запускает `experiment.py`, чтобы показать
     сообщение фичи B (код 3);
   - **запуск** `experiment.py` с переданными параметрами;
   - **сводка** из JSON-записи: `decode_tokens_per_second`, `load_seconds`,
     `total_seconds` и первые 300 символов ответа.

3. Перескажи пользователю сводку. Код выхода скрипта равен коду
   `experiment.py`: 0 — успех, 2 — неверный запуск, 3 — ошибка Ollama.
   При ошибке процитируй строку из stderr дословно, ничего не придумывай.

## Ограничения

- Только стандартная библиотека Python.
- Не создавай файлы результата в репозитории без просьбы пользователя.
- Модель не скачивай (`ollama pull`) сам — предложи команду пользователю.
