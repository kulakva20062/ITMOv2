#!/usr/bin/env bash
set -euo pipefail

practice=${1:?Укажите 7.1 или 7.2}
tools_dir=$(cd -- "$(dirname -- "$0")" && pwd)
practice_root=$(cd -- "$tools_dir/../.." && pwd)
setup="$practice_root/practice_07.2/workflows/wf-setup-data-tables.workflow.json"
case "$practice" in
  7.1)
    port=5678
    broker=5688
    workflows=("$setup" "$practice_root/practice_07.1/workflows/ai-code-review.workflow.json")
    ;;
  7.2)
    port=5679
    broker=5689
    workflows=("$practice_root/practice_07.2/workflows/"*.workflow.json)
    ;;
  *) printf 'Неизвестная практика %s\n' "$practice" >&2; exit 2 ;;
esac

if [[ -n ${N8N_BIN:-} ]]; then
  runner=("$N8N_BIN")
elif command -v n8n >/dev/null 2>&1; then
  runner=(n8n)
else
  runner=(npx --yes --package n8n@2.47.7 n8n)
fi

if [[ ${2:-} == test ]]; then
  PRACTICE_PART="$practice" node --test "$tools_dir/workflows.test.mjs"
  exec python3 -E "$tools_dir/test-n8n.py" "$practice" "${workflows[@]}" -- "${runner[@]}"
fi

export N8N_USER_FOLDER=${N8N_USER_FOLDER:-${XDG_STATE_HOME:-$HOME/.local/state}/itmo/practice-0$practice}
export N8N_PORT=${N8N_PORT:-$port}
export N8N_RUNNERS_BROKER_PORT=${N8N_RUNNERS_BROKER_PORT:-$broker}
export N8N_LISTEN_ADDRESS=${N8N_LISTEN_ADDRESS:-127.0.0.1}
export N8N_HOST=${N8N_HOST:-localhost}
export N8N_DIAGNOSTICS_ENABLED=${N8N_DIAGNOSTICS_ENABLED:-false}

umask 077
mkdir -p -- "$N8N_USER_FOLDER"
marker="$N8N_USER_FOLDER/.practice-0$practice-imported"
if [[ ! -f "$marker" ]]; then
  imports=$(mktemp -d)
  trap 'rm -rf -- "$imports"' EXIT
  cp -- "${workflows[@]}" "$imports/"
  "${runner[@]}" import:workflow --separate --input="$imports"
  touch -- "$marker"
  rm -rf -- "$imports"
  trap - EXIT
fi

editor_url=${N8N_EDITOR_BASE_URL:-${N8N_PROTOCOL:-http}://$N8N_HOST:$N8N_PORT}
health_url="${editor_url%/}/healthz/readiness"

open_editor() {
  if command -v firefox >/dev/null 2>&1; then
    firefox --new-tab "$editor_url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$editor_url"
  else
    printf 'Откройте редактор n8n на %s\n' "$editor_url"
  fi
}

if command -v curl >/dev/null 2>&1; then
  if curl --noproxy '*' -fsS --max-time 1 "$health_url" >/dev/null 2>&1; then
    open_editor
    exit
  fi
  (
    for ((attempt = 0; attempt < 90; attempt++)); do
      kill -0 "$$" 2>/dev/null || exit 0
      if curl --noproxy '*' -fsS --max-time 1 "$health_url" >/dev/null 2>&1; then
        open_editor
        exit
      fi
      sleep .5
    done
  ) &
fi
printf 'Запускаю n8n для практики %s на %s\n' "$practice" "$editor_url"
exec "${runner[@]}" start
