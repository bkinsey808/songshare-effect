#!/usr/bin/env bash
set -euo pipefail

# Gracefully stop chrome-devtools-mcp and optionally Chrome/Chromium instances
# Usage: ./scripts/mcp/stop-mcp.sh [--kill-chrome]

PATTERN='chrome-devtools-mcp'
KILL_CHROME=false
PIDFILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$PIDFILE_DIR/mcp.pid"

if [[ "${1-}" == "--kill-chrome" ]]; then
  KILL_CHROME=true
fi

echo "Stopping MCP (prefer pidfile at: $PIDFILE)"

# If a PID file exists, prefer using it (safer)
if [[ -f "$PIDFILE" ]]; then
  pid=$(cat "$PIDFILE" 2>/dev/null || true)
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Found MCP PID $pid from PIDFILE. Sending SIGINT..."
    kill -INT "$pid" || true
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
      echo "Sending SIGTERM to MCP PID $pid..."
      kill -TERM "$pid" || true
      sleep 2
    fi
    if kill -0 "$pid" 2>/dev/null; then
      echo "Forcing kill of MCP PID $pid..."
      kill -KILL "$pid" || true
    fi
    echo "Removing PID file: $PIDFILE"
    rm -f "$PIDFILE" || true
  else
    echo "PID file exists but process not found; removing stale PID file.";
    rm -f "$PIDFILE" || true
  fi
else
  echo "No PID file found; falling back to pattern-based shutdown ($PATTERN)"

  # Helper to list matching PIDs
  list_pids() {
    pgrep -af "$PATTERN" || true
  }

  pids=$(pgrep -f "$PATTERN" || true)
  if [[ -z "$pids" ]]; then
    echo "No running MCP processes found."
  else
    echo "Found MCP PIDs:"
    pgrep -af "$PATTERN" || true
    echo "Sending SIGINT..."
    pkill -f -INT "$PATTERN" || true
    sleep 2

    # if still running, try SIGTERM
    pids=$(pgrep -f "$PATTERN" || true)
    if [[ -n "$pids" ]]; then
      echo "Sending SIGTERM to remaining MCP processes..."
      pkill -f "$PATTERN" || true
      sleep 2
    fi

    # force kill as last resort
    pids=$(pgrep -f "$PATTERN" || true)
    if [[ -n "$pids" ]]; then
      echo "Forcing kill of MCP processes..."
      pkill -f -9 "$PATTERN" || true
    fi
  fi
fi

if [[ "$KILL_CHROME" == true ]]; then
  echo "Killing Chrome/Chromium processes started by the scripts (prefer pidfile)"
  PID_DIR="$HOME/.local/share/songshare-effect"
  CHROME_PIDFILE="$PID_DIR/chrome.pid"

  if [[ -f "$CHROME_PIDFILE" ]]; then
    chrome_pid=$(cat "$CHROME_PIDFILE" 2>/dev/null || true)
    if [[ -n "$chrome_pid" ]] && kill -0 "$chrome_pid" 2>/dev/null; then
      echo "Found chrome pid $chrome_pid from PIDFILE. Sending SIGINT..."
      kill -INT "$chrome_pid" || true
      sleep 2
      if kill -0 "$chrome_pid" 2>/dev/null; then
        echo "Sending SIGTERM to chrome pid $chrome_pid..."
        kill -TERM "$chrome_pid" || true
        sleep 2
      fi
      if kill -0 "$chrome_pid" 2>/dev/null; then
        echo "Forcing kill of chrome pid $chrome_pid..."
        kill -KILL "$chrome_pid" || true
      fi
      echo "Removing chrome pidfile: $CHROME_PIDFILE"
      rm -f "$CHROME_PIDFILE" || true
    else
      echo "Chrome pidfile found but process not running; removing stale file.";
      rm -f "$CHROME_PIDFILE" || true
    fi
  else
    echo "No chrome pidfile found; falling back to pattern-based pkill (may affect other Chrome instances)."
    pkill -f -INT "chromium" || true
    pkill -f -INT "chrome" || true
    sleep 2
    pkill -f "chromium" || true
    pkill -f "chrome" || true
  fi
fi

echo "Done."
