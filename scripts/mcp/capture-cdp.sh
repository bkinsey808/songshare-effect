#!/bin/bash
set -euo pipefail
DEV_SERVER_PORT=${DEV_SERVER_PORT:-5173}
DEV_SERVER_URL=${DEV_SERVER_URL:-http://localhost:${DEV_SERVER_PORT}}
CHROME_DEBUG_PORT=${CHROME_DEBUG_PORT:-9222}

if ! command -v jq &> /dev/null; then
  echo "jq required: sudo apt install jq" >&2
  exit 1
fi

WS_URL=$(curl -s "http://127.0.0.1:${CHROME_DEBUG_PORT}/json" | jq -r --arg url "$DEV_SERVER_URL" '.[] | select(.url == $url) | .webSocketDebuggerUrl' | head -n1)
if [[ -z "$WS_URL" ]]; then
  WS_URL=$(curl -s "http://127.0.0.1:${CHROME_DEBUG_PORT}/json" | jq -r --arg host "localhost:${DEV_SERVER_PORT}" '.[] | select(.url | test($host)) | .webSocketDebuggerUrl' | head -n1)
fi

if [[ -z "$WS_URL" ]]; then
  echo "No app tab found on http://127.0.0.1:${CHROME_DEBUG_PORT}. Ensure Chrome is launched with --remote-debugging-port=${CHROME_DEBUG_PORT}" >&2
  exit 1
fi

DURATION_MS=${1:-15000}
node scripts/mcp/capture-cdp.cjs "$WS_URL" "$DURATION_MS"
