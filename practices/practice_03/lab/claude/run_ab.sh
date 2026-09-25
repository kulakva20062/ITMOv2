#!/usr/bin/env bash
# A/B: same model and settings, only the system prompt differs. One new session per question.
# Usage: claude/run_ab.sh [out-dir]   (from lab/); questions 1-5 from QUESTIONS.md + extra 6
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-results/ab}
declare -A PROMPTS=([A]=demo/repo-system.txt [B]=claude/repo-system-b.txt)
mapfile -t QUESTIONS < <(grep -E '^[0-9]+\. ' QUESTIONS.md | sed -E 's/^[0-9]+\. //')
# Extra hard question 6 (QUESTIONS.md unchanged; see results/expected.md).
QUESTIONS+=('Что произойдёт при вызове subscribe(" Ann "), затем subscribe("Ann"), и что будет при subscribe(None)? Подтверди кодом.')
for v in A B; do
  for i in "${!QUESTIONS[@]}"; do
    n=$((i + 1))
    echo "== $v q$n: ${QUESTIONS[$i]}"
    claude/run_local.sh "${PROMPTS[$v]}" "${QUESTIONS[$i]}" "$OUT/$v-q$n.jsonl"
  done
done
