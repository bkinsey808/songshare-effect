#!/usr/bin/env bash
set -euo pipefail

LOG=/tmp/monitor.log
TMP_TAIL=/tmp/_ms_check_tail.log

usage() {
  echo "Usage: $0 [wait-seconds]"
  echo "  wait-seconds - optional number of seconds to wait for logs to arrive (default 0)"
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

WAIT_SECONDS=${1:-0}
if ! [[ "$WAIT_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "Invalid wait-seconds: $WAIT_SECONDS" >&2
  usage
  exit 2
fi

if [ ! -f "$LOG" ]; then
  echo "FAIL: monitor log not found at $LOG"
  exit 2
fi

if [ "$WAIT_SECONDS" -gt 0 ]; then
  echo "Waiting $WAIT_SECONDS seconds for logs..."
  sleep "$WAIT_SECONDS"
fi

# Find last Set-Cookie for userSession
LAST_SET_COOKIE_LINE=$(grep -n "Set-Cookie header: userSession" "$LOG" | tail -n1 | cut -d: -f1 || true)

if [ -z "$LAST_SET_COOKIE_LINE" ]; then
  echo "FAIL: No Set-Cookie header for userSession found in $LOG"
  exit 1
fi

echo "Found Set-Cookie header at line $LAST_SET_COOKIE_LINE"

# Tail the log from that line onward and examine the sequence
tail -n +$LAST_SET_COOKIE_LINE "$LOG" > "$TMP_TAIL"

# If the /api/me endpoint logged 'No session token found' after the Set-Cookie -> fail
if grep -q "\[api\] \[me\] No session token found" "$TMP_TAIL"; then
  echo "FAIL: /api/me observed with no session token after Set-Cookie"
  exit 1
fi

# Look for GET /api/me status codes after the Set-Cookie
API_ME_LINE=$(grep -n -E "GET \/api\/me [0-9]{3}" "$TMP_TAIL" | head -n1 | cut -d: -f1 || true)

if [ -n "$API_ME_LINE" ]; then
  API_ME_FULL=$(sed -n "${API_ME_LINE}p" "$TMP_TAIL")
  if echo "$API_ME_FULL" | grep -q -E "GET \/api\/me ([0-9]{3})"; then
    CODE=$(echo "$API_ME_FULL" | sed -E 's/.*GET \/api\/me ([0-9]{3}).*/\1/')
    if [[ "$CODE" =~ ^2[0-9]{2}$ ]]; then
      echo "PASS: /api/me returned $CODE after Set-Cookie"
      exit 0
    else
      echo "FAIL: /api/me returned $CODE after Set-Cookie"
      exit 1
    fi
  fi
fi

echo "WARN: No /api/me request observed after Set-Cookie in $LOG (timing issue?)"
exit 2
