#!/usr/bin/env bash
# Read-only local assistant: Claude Code CLI -> Ollama (Anthropic-compatible API) -> itmo-agent.
# Replaces `opencode run --agent local-guide`. Runs in lab/demo, new session per call.
# Usage: claude/run_local.sh <system-prompt-file> <question> <out.jsonl>
# OLLAMA_URL may point to a logging proxy; default is the local Ollama server.
set -euo pipefail
PROMPT=$(realpath "$1"); QUESTION=$2; OUT=$(realpath -m "$3")
LAB=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$(dirname "$OUT")"

cd "$LAB/demo"
# 127.0.0.1, not localhost: ::1 is not served by Ollama here and hangs until TCP timeout.
# API key auth disables claude.ai login/connectors; auto-memory and CLAUDE.md are disabled so
# the tested model gets only the system prompt, the question and tool results.
env -u ANTHROPIC_AUTH_TOKEN \
  ANTHROPIC_BASE_URL="${OLLAMA_URL:-http://127.0.0.1:11434}" ANTHROPIC_API_KEY=ollama \
  ANTHROPIC_DEFAULT_HAIKU_MODEL=itmo-agent ANTHROPIC_DEFAULT_SONNET_MODEL=itmo-agent \
  ANTHROPIC_DEFAULT_OPUS_MODEL=itmo-agent CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096 \
  CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 CLAUDE_CODE_DISABLE_CLAUDE_MDS=1 \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 DISABLE_TELEMETRY=1 \
  claude -p --model itmo-agent --output-format stream-json --verbose \
    --system-prompt-file "$PROMPT" \
    --tools "Read,Glob,Grep" --allowedTools "Read,Glob,Grep" \
    --setting-sources "" --strict-mcp-config --disable-slash-commands \
    --no-session-persistence --max-turns 8 \
    -- "$QUESTION" < /dev/null > "$OUT.raw" 2> "$OUT.err" || echo "claude exited with $?" >> "$OUT.err"

# Keep answer text, tool calls/results, init and result metadata; drop model reasoning.
jq -c '
  if .type == "system" and .subtype == "init" then {type, subtype, model, cwd, tools, mcp_servers, permissionMode}
  elif .type == "assistant" then
    {type, model: .message.model,
     content: [.message.content[] | select(.type != "thinking" and .type != "redacted_thinking")]}
    | select(.content | length > 0)
  elif .type == "user" then {type, content: .message.content}
  elif .type == "result" then del(.session_id, .uuid)
  else empty end' <(grep '^{' "$OUT.raw") > "$OUT"
rm -f "$OUT.raw"
grep -v "claude.ai connectors are disabled" "$OUT.err" > "$OUT.err.tmp" || true
mv "$OUT.err.tmp" "$OUT.err"; [ -s "$OUT.err" ] || rm -f "$OUT.err"
jq -r 'select(.type=="result") | "result: \(.subtype) turns=\(.num_turns) duration_ms=\(.duration_ms)\n\(.result)"' "$OUT"
