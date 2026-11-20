#!/bin/sh
# PostToolUse hook: после правки кода агентом запускает scripts/check.sh
# и возвращает результат агенту (успех — additionalContext, провал — exit 2 + stderr).
input=$(cat)
file=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.tool_input?.file_path??"")}catch{}})')
case "$file" in
  *.js|*.mjs|*.html|*.css|*.sh) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
out=$(sh scripts/check.sh 2>&1)
summary=$(printf '%s\n' "$out" | grep -E '^ℹ (tests|pass|fail) ' | tr '\n' ' ')
if printf '%s' "$out" | grep -q '^ℹ fail 0'; then
  node -e 'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:"check-after-edit: PASS — "+process.argv[1]}}))' "$summary"
  exit 0
fi
printf 'check-after-edit: FAIL после правки %s — %s\n' "$file" "$summary" >&2
printf '%s\n' "$out" | grep -E '^not ok|^# Subtest|✖|AssertionError|expected|actual' | head -30 >&2
exit 2
