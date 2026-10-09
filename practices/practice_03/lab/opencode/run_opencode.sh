#!/usr/bin/env bash
# Read-only local assistant via OpenCode: agent local-guide from demo/opencode.json -> Ollama itmo-agent.
# Runs in lab/demo, new session per call.
# Usage: opencode/run_opencode.sh <question> <out.jsonl>
set -euo pipefail
if [ $# -ne 2 ]; then
  echo "usage: $0 <question> <out.jsonl>" >&2
  echo "example: $0 \"Как запустить тесты? Укажи файл-источник.\" /tmp/q1.jsonl" >&2
  exit 2
fi
QUESTION=$1; OUT=$(realpath -m "$2")
LAB=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$(dirname "$OUT")"

cd "$LAB/demo"
# /etc/opencode/opencode.json (managed NixOS config) forces its own default model,
# so the model is passed explicitly. enabled_providers in demo/opencode.json leaves only ollama.
opencode run --agent local-guide -m ollama/itmo-agent --format json \
  -- "$QUESTION" < /dev/null > "$OUT" 2> "$OUT.err" || echo "opencode exited with $?" >> "$OUT.err"

grep -v -E "[Dd]atabase migration|sqlite-migration" "$OUT.err" > "$OUT.err.tmp" || true
mv "$OUT.err.tmp" "$OUT.err"; [ -s "$OUT.err" ] || rm -f "$OUT.err"
jq -r 'select(.type=="text") | .part.text' "$OUT"
