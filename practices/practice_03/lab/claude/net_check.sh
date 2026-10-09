#!/usr/bin/env bash
# Runs one local question and samples TCP sockets of the tested Claude Code process
# (on NixOS its process name is .claude-wrapped) from start to exit.
# Usage: claude/net_check.sh <system-prompt-file> <question> <out.jsonl> <report.txt>
set -euo pipefail
cd "$(dirname "$0")/.."
BEFORE=" $(pgrep -x .claude-wrapped | tr '\n' ' ') "
claude/run_local.sh "$1" "$2" "$3" > "$4.answer" &
RUN=$!
P=""
while [ -z "$P" ] && kill -0 $RUN 2>/dev/null; do
  for p in $(pgrep -x .claude-wrapped); do [[ $BEFORE == *" $p "* ]] || P=$p; done
  sleep 0.05
done
while [ -n "$P" ] && [ -d /proc/$P ]; do ss -tnpH | grep "pid=$P," || true; sleep 0.1; done > "$4.raw"
wait $RUN
{
  echo "# TCP sockets of tested process pid=$P, sampled every 0.1 s from start to exit"
  echo "# samples: $(wc -l < "$4.raw")"
  echo "# unique remote endpoints:"
  awk '{print $5}' "$4.raw" | sed -E 's/:[0-9]+$/:PORT/;' | sort | uniq -c
  awk '{print $5}' "$4.raw" | grep -oE ':[0-9]+$' | sort | uniq -c | sed 's/^/# port /'
  echo "# answer:"; cat "$4.answer"
} > "$4"
rm -f "$4.raw" "$4.answer"
cat "$4"
