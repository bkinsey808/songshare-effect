#!/usr/bin/env bash
set -euo pipefail

# Start chrome-devtools-mcp and write PID file for safer shutdown
# Usage: ./scripts/mcp/start-mcp.sh [--port 9222] [--address localhost] [--force]
# You can override the MCP command with the environment variable MCP_CMD.

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDFILE="$BASE_DIR/mcp/mcp.pid"
LOGFILE="$BASE_DIR/mcp/mcp.log"

PORT=9222
ADDRESS=localhost
FORCE=false

while [[ ${#} -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --address) ADDRESS="$2"; shift 2 ;;
    --force) FORCE=true; shift ;;
    --help) echo "Usage: $0 [--port 9222] [--address localhost] [--force]"; exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

mkdir -p "$BASE_DIR/mcp"

if [[ -f "$PIDFILE" ]]; then
  existing_pid=$(cat "$PIDFILE" 2>/dev/null || true)
  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
    if [[ "$FORCE" == "true" ]]; then
      echo "Killing existing MCP PID $existing_pid (force)"
      kill -INT "$existing_pid" || true
      sleep 1
    else
      echo "MCP already running (PID: $existing_pid). Use --force to restart."
      exit 1
    fi
  else
    echo "Removing stale PID file: $PIDFILE"
    rm -f "$PIDFILE"
  fi
fi

# Allow overriding the MCP command (useful for testing)
if [[ -n "${MCP_CMD-}" ]]; then
  MCP_CMD="$MCP_CMD"
else
  MCP_CMD="$BASE_DIR/mcp/mcp-npx-wrapper.sh --no-install chrome-devtools-mcp serve --port $PORT --address $ADDRESS"
fi

echo "Starting MCP with command: $MCP_CMD"
# start in background and capture PID
nohup bash -lc "$MCP_CMD" >> "$LOGFILE" 2>&1 &
MCP_PID=$!
echo "$MCP_PID" > "$PIDFILE"
echo "Started MCP (PID $MCP_PID) -> PIDFILE=$PIDFILE, LOG=$LOGFILE"

exit 0
