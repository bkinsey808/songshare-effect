#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PID_FILE="$SCRIPT_DIR/mcp.pid"

echo "[dev:mcp:stop] stopping development servers"

# Try to stop wrangler/vite processes launched under this user
echo "[dev:mcp:stop] killing known dev processes (wrangler, vite)"
pkill -u "$USER" -f "wrangler dev" || true
pkill -u "$USER" -f "node .*vite" || true
pkill -u "$USER" -f "\bvite\b" || true

# If a PID file exists for MCP, try to stop that PID specifically
if [ -f "$PID_FILE" ]; then
	MCP_PID=$(cat "$PID_FILE" 2>/dev/null || true)
	if [ -n "$MCP_PID" ] && kill -0 "$MCP_PID" 2>/dev/null; then
		echo "[dev:mcp:stop] stopping MCP pid $MCP_PID"
		kill "$MCP_PID" || true
		# wait up to 5s for it to exit, then SIGKILL
		for i in {1..10}; do
			if ! kill -0 "$MCP_PID" 2>/dev/null; then
				break
			fi
			sleep 0.5
		done
		if kill -0 "$MCP_PID" 2>/dev/null; then
			echo "[dev:mcp:stop] MCP pid did not exit, sending SIGKILL"
			kill -9 "$MCP_PID" || true
		fi
	fi
	rm -f "$PID_FILE" || true
fi

echo "[dev:mcp:stop] stopping chrome and mcp via helper scripts (best-effort)"
# stop chrome (helper accepts --kill-chrome)
./scripts/mcp/stop-mcp.sh --kill-chrome || true
# also call npm wrappers for compatibility
npm run chrome:stop || true
npm run mcp:stop || true

# Give processes a brief moment to shut down gracefully
sleep 0.2

echo "[dev:mcp:stop] force-killing any remaining user chrome/vite processes"
pkill -u "$USER" -f "chromium" || true
pkill -u "$USER" -f "chrome" || true
pkill -u "$USER" -f "node .*vite" || true
pkill -u "$USER" -f "\bvite\b" || true

echo "[dev:mcp:stop] removing pid/log files"
rm -f "$SCRIPT_DIR/mcp.pid" /tmp/mcp-start.log /tmp/dev-mcp.pid /tmp/dev-mcp-run.log /tmp/chrome-debug.log /tmp/dev-servers.log || true

echo "[dev:mcp:stop] completed"
