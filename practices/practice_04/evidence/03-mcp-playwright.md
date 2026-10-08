# MCP playwright: первый вызов на пустом проекте

Промпт студента: «Используй MCP playwright: открой http://localhost:8000/ и расскажи, что реально находится на странице. Ничего не исправляй.»

## Сессия `03-mcp`
- session_id: `4b411648-9378-4089-81e8-1315e11bab19`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- вызовы инструментов (8):
  1. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_console_messages,mcp__playwri …
  2. `mcp__playwright__browser_navigate` http://localhost:8000/
  3. `mcp__playwright__browser_snapshot` {}
  4. `mcp__playwright__browser_console_messages` {"level": "error"}
  5. `mcp__playwright__browser_navigate` http://localhost:8000/index.html
  6. `mcp__playwright__browser_snapshot` {}
  7. `mcp__playwright__browser_navigate` http://localhost:8000/src/
  8. `mcp__playwright__browser_snapshot` {}

Итог сессии (9 ходов):

> Проверил через Playwright, ничего не менял.
> 
> **http://localhost:8000/ — это не лендинг, а автосгенерированный листинг каталога** (`python -m http.server`-стиль):
> 
> - Заголовок страницы: «Directory listing for /», `<h1>` тот же, дальше просто `<ul>` со ссылками.
> - Содержимое: `.claude/`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `docs/`, `package.json`, `scripts/`, `src/`, `tests/`.
> - В консоли одна ошибка: `GET /favicon.ico → 404`.
> 
> **http://localhost:8000/index.html → HTTP 404 «File not found»** — стандартная страница ошибки сервера («Error code: 404 / Nothing matches the given URI»). Файла `index.html` в корне нет, поэтому сервер и отдаёт листинг вместо страницы.
> 
> Для контекста: в `src/` сейчас лежит единственный файл `format.js` — то есть никакой вёрстки (HTML/CSS) в раздаваемом каталоге пока не существует, только документация, тесты и одна JS-утилита.

