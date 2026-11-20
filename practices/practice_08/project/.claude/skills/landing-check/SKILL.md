---
name: landing-check
description: Проверяет лендинг AutoDrive на правила AGENTS.md, критерии docs/requirements.md и docs/style-guide.md — статический аудит, тесты, адаптивность в браузере, контраст палитры — и пишет отчёт. Используй после правок вёрстки и перед приёмкой фичи.
---

# Проверка лендинга

Скилл только проверяет. Код не исправляй — найденные проблемы перечисли в отчёте, исправления делаются отдельным поручением.

## 1. Прочитай критерии
- `AGENTS.md` — правила проекта.
- `docs/requirements.md` — критерии приёмки фич A и B.
- `docs/style-guide.md`, если есть.

## 2. Статический аудит
Из корня проекта:

```sh
node .claude/skills/landing-check/scripts/audit.mjs index.html
```

Скрипт печатает JSON: `checks[]` со статусом `PASS`/`FAIL` по каждому правилу (один `h1`, уникальные `id`, обязательные секции, якоря, внешние ресурсы, подписи `img`/`svg`, заглушки контактов, FAQ, `viewport`, `lang`). Код выхода 1 — есть `FAIL`, 2 — нет файла.

## 3. Тесты
`sh scripts/check.sh` — зафиксируй число `pass`/`fail`.

## 4. Браузер (MCP playwright)
Если `http://localhost:8000/` не отвечает, попроси студента запустить `python3 -m http.server 8000` — сам долгоживущий сервер не поднимай.
1. `browser_navigate` на `http://localhost:8000/`.
2. Для ширин 360 и 1280 (`browser_resize`, высота 800) выполни `browser_evaluate`:
   `() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })` — `scroll > client` значит горизонтальный скролл, это `FAIL`.
3. `browser_console_messages` с уровнем `error` — ошибки JS это `FAIL`.
4. Сделай `browser_take_screenshot` на обеих ширинах и посмотри на них: совпадает ли страница со style guide.

## 5. Контраст палитры (MCP contrast)
Для каждого токена текста из таблицы `docs/style-guide.md` вызови `check_contrast` с фоном `--paper`: `--ink`, `--ink-2`, `--stamp` — как `normal`; текст на кнопке `--signal` — пара `--ink` на `--signal`. Токены сервер читает из `:root` в `styles.css`, поэтому проверяется реальный код, а не таблица. `AA.pass: false` — это `FAIL`. Если tool вернул `isError`, приведи его текст в отчёте.

## 6. Отчёт
Запиши `docs/landing-check-report.md`:
- таблица «проверка — статус — подробности» по шагам 2–5;
- раздел «Соответствие style guide» — конкретные расхождения со ссылкой на файл и селектор;
- итог одной строкой: `ИТОГ: PASS` или `ИТОГ: FAIL (N проблем)`.

Отвечая в чате, приведи итог и список `FAIL`. Не называй проверку пройденной, если какой-то шаг не выполнился — так и напиши, какой и почему.
