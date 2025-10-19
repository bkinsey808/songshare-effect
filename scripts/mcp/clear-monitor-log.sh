#!/usr/bin/env bash
set -euo pipefail

MONITOR_LOG=/tmp/monitor.log
MONITOR_PIDFILE=/tmp/dev-mcp-monitor.pid

if [ -f "$MONITOR_LOG" ]; then
  # Truncate the monitor log safely
  : > "$MONITOR_LOG"
  echo "Cleared $MONITOR_LOG"
else
  echo "$MONITOR_LOG does not exist; nothing to clear"
fi

# If a monitor pidfile exists and the PID is not running, remove the stale pidfile
if [ -f "$MONITOR_PIDFILE" ]; then
  PID=$(cat "$MONITOR_PIDFILE" 2>/dev/null || echo "")
  if [ -n "$PID" ] && ! kill -0 "$PID" 2>/dev/null; then
    rm -f "$MONITOR_PIDFILE" || true
    echo "Removed stale monitor pidfile: $MONITOR_PIDFILE"
  else
    echo "Monitor pidfile present (pid: $PID)"
  fi
fi
