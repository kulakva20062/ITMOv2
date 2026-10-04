#!/bin/sh
# PostToolUse hook для Edit|Write: запускает проверку проекта.
# При сбое печатает вывод в stderr и выходит с кодом 2 — Claude Code вернёт его агенту.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 2
if output=$(sh scripts/check.sh 2>&1); then
    # stdout в формате JSON: additionalContext попадает в контекст агента.
    echo '{"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "check.sh: PASS"}}'
    exit 0
fi
printf 'check.sh: FAIL\n%s\n' "$output" >&2
exit 2
