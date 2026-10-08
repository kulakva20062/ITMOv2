# Hook: FAIL после правки и PASS после исправления

Промпт студента: «Создай временный тест с assert.equal(1, 2), процитируй ответ hook; исправь на assert.equal(1, 1) и снова процитируй.»

## Сессия `05-hook`
- session_id: `f4c2c3fb-d809-4cf4-a912-0abb9b2babec`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('claude-in-chrome', 'connected')]
- вызовы инструментов (7):
  1. `Read` docs/style-guide.md
  2. `Read` .claude/settings.json
  3. `Grep` {"pattern": "tabular-nums|border-radius|formatPrice", "path": ".", "output_mode": …
  4. `Read` styles.css
  5. `Read` styles.css
  6. `Write` tests/tmp-hook.test.js
  7. `Edit` tests/tmp-hook.test.js
- ответы hook (из --debug-file, по одному на запуск; подряд одинаковые схлопнуты в ×N):
  - check-after-edit: FAIL после правки tests/tmp-hook.test.js — ℹ tests 25 ℹ pass 24 ℹ fail 1
  - check-after-edit: PASS — ℹ tests 25 ℹ pass 25 ℹ fail 0

Итог сессии (8 ходов):

> **3) Ответ hook после исправления:**
> 
> ```
> check-after-edit: PASS — ℹ tests 25 ℹ pass 25 ℹ fail 0
> ```
> 
> Hook работает корректно в обе стороны: на `Write` с падающим тестом он вернул блокирующую ошибку (exit code 2) с цитатой вывода `node --test`, на `Edit` с валидным утверждением — PASS как информационный контекст. Файл `tests/tmp-hook.test.js` оставлен на месте (вы просили больше ничего не менять) — скажите, когда удалить.

