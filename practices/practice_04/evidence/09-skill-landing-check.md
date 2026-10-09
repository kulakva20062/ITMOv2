# Skill landing-check: запуск и проверенный результат

Промпт студента: «Запусти skill landing-check на текущем лендинге. → Разрешение на скрипт аудита добавлено, выполни шаг 2 и обнови отчёт.»

## Сессия `10-landing-check`
- session_id: `648d08ca-9717-41c5-b082-9e78e5217426`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('contrast', 'connected'), ('claude-in-chrome', 'connected')]
- субагент `tester` в списке агентов
- вызовы инструментов (28):
  1. `Skill` landing-check
  2. `Read` AGENTS.md
  3. `Read` docs/requirements.md
  4. `Read` docs/style-guide.md
  5. `Bash` node .claude/skills/landing-check/scripts/audit.mjs index.html; echo "EXIT=$?"
  6. `Bash` sh scripts/check.sh 2>&1 | tail -40; echo "EXIT=$?"
  7. `Bash` node .claude/skills/landing-check/scripts/audit.mjs index.html
  8. `Bash` sh scripts/check.sh
  9. `Bash` node .claude/skills/landing-check/scripts/audit.mjs index.html
  10. `ToolSearch` {"query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_resize,mcp__playwright__browser_evaluate,mcp__playwright__brows …
  11. `mcp__playwright__browser_navigate` http://localhost:8000/
  12. `mcp__contrast__check_contrast` {"foreground": "--ink", "background": "--paper", "text_size": "normal"}
  13. `mcp__contrast__check_contrast` {"foreground": "--ink-2", "background": "--paper", "text_size": "normal"}
  14. `mcp__contrast__check_contrast` {"foreground": "--stamp", "background": "--paper", "text_size": "normal"}
  15. `mcp__contrast__check_contrast` {"foreground": "--ink", "background": "--signal", "text_size": "normal"}
  16. `mcp__playwright__browser_resize` {"width": 360, "height": 800}
  17. `mcp__playwright__browser_evaluate` {"function": "() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })"}
  18. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-landing-360.png", "fullPage": true}
  19. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/landing-360.png", "fullPage": true}
  20. `Read` /tmp/p4-playwright/landing-360.png
  21. `mcp__playwright__browser_resize` {"width": 1280, "height": 800}
  22. `mcp__playwright__browser_evaluate` {"function": "() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })"}
  23. `mcp__playwright__browser_take_screenshot` {"scale": "css", "filename": "/tmp/p4-playwright/landing-1280.png", "fullPage": true}
  24. `mcp__playwright__browser_console_messages` {"level": "error"}
  25. `Read` /tmp/p4-playwright/landing-1280.png
  26. `Read` .claude/settings.json
  27. `Read` .claude/skills/landing-check/scripts/audit.mjs
  28. `Write` docs/landing-check-report.md

Итог сессии (32 ходов):

> Отчёт записан в `docs/landing-check-report.md`.
> 
> **ИТОГ: FAIL (1 проблема)**
> 
> FAIL:
> - **Шаг 2 «Статический аудит» не выполнен.** `node .claude/skills/landing-check/scripts/audit.mjs index.html` дважды вернул «This command requires approval» — разрешения на запуск не было, результатов нет. Проверку пройденной назвать нельзя.
> 
> Что отработало (всё PASS):
> - `sh scripts/check.sh` — tests 66, pass 66, fail 0.
> - Горизонтальный скролл: 360 → scroll 360 = client 360; 1280 → 1280 = 1280.
> - Консоль: 0 ошибок.
> - Скриншоты на обеих ширинах: лист осмотра, рейка подписей, волосяные линии, без теней — расхождений со style guide не видно, калькулятор продолжает тот же язык.
> - Контраст по токенам из `styles.css`: `--ink`/`--paper` 12.72, `--ink-2`/`--paper` 5.01, `--stamp`/`--paper` 5.28, `--ink`/`--signal` 7.77 — все AA pass.
> 
> Разреши запуск `node .claude/skills/landing-check/scripts/audit.mjs` — прогоню шаг 2 и обновлю отчёт.

## Сессия `10b-landing-check`
- session_id: `648d08ca-9717-41c5-b082-9e78e5217426`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('contrast', 'connected'), ('claude-in-chrome', 'connected')]
- субагент `tester` в списке агентов
- вызовы инструментов (3):
  1. `Bash` node .claude/skills/landing-check/scripts/audit.mjs index.html
  2. `Edit` docs/landing-check-report.md
  3. `Edit` docs/landing-check-report.md

Итог сессии (4 ходов):

> **ИТОГ: PASS** — FAIL нет ни на одном шаге.
> 
> Шаг 2, статический аудит `index.html` — 10 проверок, 0 FAIL:
> - ровно один `h1`; `id` уникальны
> - секции `hero, fleet, benefits, how, faq, contacts` на месте, 7 якорей ведут на существующие `id`
> - внешних ресурсов нет; `img` без `alt` — 0, `svg` без `aria` — 0 из 1
> - контакты только заглушки; FAQ — 4 `details/summary`; `meta viewport` и `html lang="ru"` есть
> 
> Вместе с ранее выполненными шагами 3–5 (66/66 тестов, нет горизонтального скролла на 360 и 1280, 0 ошибок в консоли, все 4 пары контраста проходят AA) проверка пройдена полностью. `docs/landing-check-report.md` обновлён: строка аудита заполнена фактическим результатом, итог переписан на PASS с пометкой, почему шаг сначала не отработал.

