# Шаг 0. Агент видит OpenSpec

## Сессия `00-setup` — основной чат

Промпт:

```text
Сделай в shell и покажи вывод: openspec --version, затем openspec list --json. Убедись, что корень проекта — текущая папка (есть openspec/config.yaml). Ничего не меняй.
```

- session_id: `ba103fbc-bfd3-4d0b-89ed-eeb31c1595f1`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (2):
  1. `Bash` pwd; ls openspec/config.yaml 2>&1; openspec --version 2>&1
  2. `Bash` openspec list --json 2>&1
- итог: success, 3 ходов, 8 с

Ответ агента:

Корень проекта — текущая папка, `openspec/config.yaml` на месте.

**`openspec --version`**
```
1.14.2
```

**`openspec list --json`**
```json
{
  "changes": [],
  "root": {
    "path": "/home/kulakva/Documents/ITMOv2/practices/practice_05/project",
    "source": "nearest"
  }
}
```

Активных changes нет. Ничего не менял.
