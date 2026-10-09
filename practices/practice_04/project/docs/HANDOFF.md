# HANDOFF — AutoDrive

## Состояние
- Фича A (лендинг) и фича B (калькулятор) готовы и объединены в ветке практики: commits `6706e48` (среда + A), `fe9cdec` (style guide, hook, tester), `669b085` (B, принята после ревью tester).
- Домашнее задание: свой MCP `contrast` (`.claude/mcp/contrast_server.py`), skill `landing-check` запущен — `docs/landing-check-report.md`, ИТОГ: PASS.
- `sh scripts/check.sh` — 66 тестов, все проходят.

## Источники
- Правила: `AGENTS.md` (подключён через `CLAUDE.md`).
- Контракт фич: `docs/requirements.md`; стиль: `docs/style-guide.md`.
- Skills: `.claude/skills/frontend-design` (Anthropic), `.claude/skills/landing-check` (свой).
- MCP: `.mcp.json` — `playwright` (браузер, системный Chromium) и свой `contrast` (`check_contrast`, контраст WCAG по токенам `styles.css`).
- Hook: `.claude/hooks/check-after-edit.sh` на PostToolUse `Edit|Write|MultiEdit`.
- Субагент: `.claude/agents/tester.md`.

## Проверки
- `sh scripts/check.sh` (или `make -C .. test`).
- Браузер: `python3 -m http.server 8000` из корня проекта, затем `http://localhost:8000/`.
- Аудит: `node .claude/skills/landing-check/scripts/audit.mjs index.html`.

## Ограничения и решения
- Автопарк сделан реестром строк вместо карточек (решение студента; каждая строка — элемент с `data-car-id`).
- `--ink-2` затемнён до `#5A6871` после ревью tester (было 3.70:1, требование AA 4.5:1).
- Не исправлено намеренно: ввод `1e1` принимается как 10 суток; при загрузке строка автопарка не помечена выбранной; у итога нет `aria-live`.

## Что дальше
- Открытые мелочи из раздела выше (`1e1`, выбранная строка при загрузке, `aria-live`) — по решению студента.
