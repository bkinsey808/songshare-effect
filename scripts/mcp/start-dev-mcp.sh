#!/usr/bin/env bash
set -euo pipefail

# Start script for dev:mcp — starts chromium, starts MCP, waits for MCP readiness, then runs dev servers
echo "making mcp wrapper executable"
chmod +x ./scripts/mcp/mcp-npx-wrapper.sh || true

echo "starting chromium (background)"
nohup env USE_LINUX_CHROME=1 ./scripts/mcp/start-chrome-debug.sh > /tmp/chrome-debug.log 2>&1 & CH_PID=$!

sleep 1

echo "starting MCP"
nohup ./scripts/mcp/start-mcp.sh > /tmp/mcp-start.log 2>&1 || true

echo "waiting for MCP to become ready"
for i in {1..30}; do
  curl -sS http://127.0.0.1:9222/json >/dev/null 2>&1 && break || sleep 0.5
done

if ! curl -sS http://127.0.0.1:9222/json >/dev/null 2>&1; then
  echo "MCP did not become ready; check /tmp/mcp-start.log and scripts/mcp/mcp.log" >&2
  exit 1
fi

echo "MCP ready; starting dev servers"

# Start dev servers in the background and write their output to a dedicated log.
echo "starting dev servers (background)"
nohup npm run dev:all > /tmp/dev-servers.log 2>&1 & DEV_PID=$! || true

echo "dev servers started (pid: $DEV_PID)"

# Always ensure a non-blocking combined monitor is running so users can
# inspect logs without the start script hanging. We create a pid file to
# avoid starting multiple monitors.
MONITOR_PIDFILE=/tmp/dev-mcp-monitor.pid
if [ -f "$MONITOR_PIDFILE" ] && kill -0 "$(cat "$MONITOR_PIDFILE")" 2>/dev/null; then
  echo "Background monitor already running (pid: $(cat "$MONITOR_PIDFILE"))"
else
  echo "Starting background monitor -> /tmp/monitor.log"
  nohup bash -lc 'tail -n 200 -F /tmp/dev-servers.log /tmp/dev-mcp.log /tmp/chrome-debug.log scripts/mcp/mcp.log > /tmp/monitor.log 2>&1' &
  MONITOR_PID=$!
  # Best-effort write pidfile
  echo "$MONITOR_PID" > "$MONITOR_PIDFILE" 2>/dev/null || true
  echo "monitor pid: $MONITOR_PID"
fi

echo "Started MCP/Chrome/dev servers in background. To watch logs:"
echo "  tail -n 200 -f /tmp/monitor.log"

