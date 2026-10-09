# Собственный MCP contrast: успешный вызов и ошибочный вход

Промпт студента: «Через MCP-сервер contrast проверь --ink-2 на --paper, старое #6E7D86 и ошибочный вход '#12345' / '--no-such-token'. Ничего не меняй.»

## Сессия `09-mcp-contrast`
- session_id: `91fde827-278d-4f2c-9c93-b19faed49fe6`, модель `claude-opus-5[1m]`
- skills проекта в init: ['frontend-design', 'landing-check']; MCP: [('playwright', 'connected'), ('contrast', 'connected'), ('claude-in-chrome', 'connected')]
- субагент `tester` в списке агентов
- вызовы инструментов (6):
  1. `ToolSearch` {"query": "select:mcp__contrast__check_contrast", "max_results": 1}
  2. `Grep` {"pattern": "--ink-2|--paper", "output_mode": "content", "glob": "**/*.css", "head_limit": 20}
  3. `mcp__contrast__check_contrast` {"foreground": "--ink-2", "background": "--paper"}
  4. `mcp__contrast__check_contrast` {"foreground": "#6E7D86", "background": "--paper"}
  5. `mcp__contrast__check_contrast` {"foreground": "#12345", "background": "--no-such-token"}
  6. `mcp__contrast__check_contrast` {"foreground": "--ink", "background": "--no-such-token"}

Итог сессии (7 ходов):

> Проверено через MCP-сервер `contrast`, файлы не менялись.
> 
> **1) `--ink-2` на `--paper` — AA проходит.** Tool вернул:
> ```json
> {
>   "foreground": { "input": "--ink-2", "hex": "#5A6871" },
>   "background": { "input": "--paper", "hex": "#EDF0EE" },
>   "text_size": "normal",
>   "ratio": 5.01,
>   "AA":  { "required": 4.5, "pass": true },
>   "AAA": { "required": 7.0, "pass": false }
> }
> ```
> Совпадает с комментарием в `styles.css:7` («Контраст к --paper 5.01:1»).
> 
> **2) Старое значение `#6E7D86` на `--paper` — AA не проходит.**
> ```json
> {
>   "foreground": { "input": "#6E7D86", "hex": "#6E7D86" },
>   "background": { "input": "--paper", "hex": "#EDF0EE" },
>   "text_size": "normal",
>   "ratio": 3.7,
>   "AA":  { "required": 4.5, "pass": false },
>   "AAA": { "required": 7.0, "pass": false }
> }
> ```
> Т.е. правка `#6E7D86 → #5A6871` подняла контраст 3.7 → 5.01 и именно она закрыла AA.
> 
> **3) Ошибочный вход `foreground: '#12345'`, `background: '--no-such-token'`** — tool вернул ошибку, а не результат:
> ```
> Ошибка входа: '#12345' → '#12345' не hex-цвет; ожидается #RGB или #RRGGBB
> ```
> Валидация останавливается на первом невалидном аргументе, поэтому про `--no-such-token` в этом сообщении ничего нет. Отдельной проверкой (`--ink` / `--no-such-token`) убедился, что для токена сообщение своё и со списком доступных:
> ```
> Ошибка входа: токен --no-such-token не найден в :root файла styles.css; доступны: --display, --gap, --ink, --ink-2, --page, --paper, --rail, --rule, --signal, --stamp, --text
> ```

