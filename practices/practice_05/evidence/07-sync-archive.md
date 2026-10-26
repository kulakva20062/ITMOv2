# Шаг 6. /opsx:sync и /opsx:archive

## Сессия `06-sync-archive` — основной чат

Промпт:

```text
/opsx:sync fleet-filter
Покажи diff текущей спецификации.
Сверь её с принятым поведением (независимая проверка подтвердила все сценарии, 86/86 тестов).
Затем выполни /opsx:archive fleet-filter.
Покажи main specs и запись в archive.
```

- session_id: `7012ef3d-372a-4022-8064-d545c75cfc9a`, модель `claude-opus-5`
- skills проекта в init: ['frontend-design', 'landing-check', 'openspec-apply-change', 'openspec-archive-change', 'openspec-explore', 'openspec-propose', 'openspec-sync-specs', 'openspec-update-change']
- MCP: [('playwright', 'connected'), ('contrast', 'connected')]
- вызовы инструментов (15):
  1. `Read` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/changes/fleet-filter/specs/fleet-filtering/spec.md
  2. `Bash` openspec instructions specs --change "fleet-filter" --json 2>&1 | head -c 600; echo; echo "=== EXIT: $?"
  3. `Bash` openspec instructions specs --change "fleet-filter" --json 2>&1 | grep -o '"rules":[^]]*]'
  4. `Bash` openspec instructions specs --change "fleet-filter" --json > /tmp/specrules.json 2>&1; echo "exit=$?"; grep -c '"artifactId": "specs"' /tmp/ …
  5. `Bash` openspec instructions specs --change "fleet-filter" --json | grep -c '"artifactId": "specs"'
  6. `Write` /home/kulakva/Documents/ITMOv2/practices/practice_05/project/openspec/specs/fleet-filtering/spec.md
  7. `Bash` openspec validate --specs 2>&1
  8. `Bash` openspec validate --specs --strict 2>&1
  9. `Bash` openspec list --specs --json 2>&1
  10. `Bash` openspec archive fleet-filter 2>&1
  11. `Bash` openspec archive fleet-filter --yes 2>&1
  12. `Bash` ls -R openspec/specs openspec/changes 2>&1
  13. `Bash` openspec list --json 2>&1; echo "=== specs ==="; openspec list --specs 2>&1
  14. `Bash` sh scripts/check.sh 2>&1 | tail -4
  15. `Bash` sh scripts/check.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
- итог: success, 16 ходов, 91 с

Ответ агента:

## Specs Synced + Archived: fleet-filter

### Diff спецификации

`openspec/specs/` был пуст, поэтому диф — целиком новый файл: **8 требований, 17 сценариев добавлены**, ничего не изменено и не удалено. Дельта слита в формат main spec: `## Purpose` скопирован дословно, заголовок `## ADDED Requirements` заменён на единую секцию `## Requirements`, операционные заголовки не попали в результат.

`openspec validate --specs --strict` — passed.

### Main specs

```
openspec/specs/
└── fleet-filtering/
    └── spec.md          requirements 8
```

**`fleet-filtering`** — Purpose: отбор машин автопарка по классу и коробке передач. Требования:

1. Отбор по классу автомобиля
2. Отбор по коробке передач
3. Условия фильтра сочетаются по И
4. Значение «любой» не ограничивает отбор
5. Счётчик показанных машин
6. Пустой результат отбора
7. Неизвестное значение фильтра отвергается
8. Отбор сохраняет прежние сценарии автопарка и калькулятора

### Запись в archive

```
openspec/changes/archive/2026-10-23-fleet-filter/
├── design.md
├── proposal.md
├── tasks.md              21/21 задач
└── specs/fleet-filtering/spec.md
```

Активных изменений не осталось (`openspec list` → пусто).

Архив сообщил `Totals: + 0, ~ 0, - 0, → 0 — Specs already in sync; no files changed`. Это полезный сигнал: мой ручной merge совпал с тем, что сделал бы сам archive, байт в байт — расхождения между синком и архивацией нет.

### Состояние проекта

`sh scripts/check.sh` после архивации — **86/86 pass, 0 fail**. Код не трогал, артефакты только перемещены в архив.

Два момента с прошлого шага остаются открытыми и к архивации отношения не имеют:

- **`fleet-filter-360.png`** в корне проекта — мой временный скриншот, удалить не смог (песочница блокирует `rm`). Убери вручную перед сдачей.
- **Тесное место на 360 px** — «Любая коробка» подпирает стрелку селекта. Критериям не противоречит, поэтому оставил как есть; если захочешь поправить, это отдельное изменение.

Коммит не делал — по `AGENTS.md` это твой шаг.
