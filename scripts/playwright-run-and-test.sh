#!/usr/bin/env bash
set -euo pipefail

# Start frontend and api dev servers (if not already running), wait until ready,
# run Playwright tests, then shut down any processes this script started.
# Logs are written to /tmp/playwright-dev-*.log

LOG_DIR=${LOG_DIR:-/tmp}
CLIENT_LOG="$LOG_DIR/playwright-dev-client.log"
API_LOG="$LOG_DIR/playwright-dev-api.log"

FRONT_PID=0
API_PID=0
FRONT_STARTED=0
API_STARTED=0

probe_frontend() {
  curl -sSk --max-time 2 https://127.0.0.1:5173 >/dev/null 2>&1
}

probe_api() {
  curl -sS --max-time 2 -I http://127.0.0.1:8787 >/dev/null 2>&1
}

echo "Playwright dev+test: logs -> $CLIENT_LOG, $API_LOG"
: >"$CLIENT_LOG" || true
: >"$API_LOG" || true

if probe_frontend; then
  echo "Frontend already listening on 5173; will reuse existing server"
  FRONT_STARTED=0
else
  echo "Starting frontend..."
  npm run dev:client >"$CLIENT_LOG" 2>&1 &
  FRONT_PID=$!
  FRONT_STARTED=1
fi

if probe_api; then
  echo "API already listening on 8787; will reuse existing server"
  API_STARTED=0
else
  echo "Starting API..."
  pushd api >/dev/null
  env CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}" npx wrangler dev --no-enable-containers --env dev >"$API_LOG" 2>&1 &
  API_PID=$!
  popd >/dev/null
  API_STARTED=1
fi

echo "Waiting for dev servers to become ready (timeout 120s)"
START_TS=$(date +%s)
TIMEOUT=120
while true; do
  if probe_frontend && probe_api; then
    echo "Dev servers are ready"
    break
  fi
  NOW=$(date +%s)
  if [ $((NOW - START_TS)) -ge $TIMEOUT ]; then
    echo "Timed out waiting for dev servers" >&2
    cat "$CLIENT_LOG" || true
    cat "$API_LOG" || true
    exit 1
  fi
  sleep 1
done

# Run Playwright tests against the local dev site. Allow passing additional args
# to this script which will be forwarded to playwright. Use HTTPS base URL.
export PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL:-https://localhost:5173}
set +e
npx playwright test "$@" --reporter=list
EXIT_CODE=$?
set -e

echo "Playwright exited with code $EXIT_CODE"

# Tear down any processes we started
if [ "$FRONT_STARTED" -eq 1 ] && [ "$FRONT_PID" -ne 0 ]; then
  echo "Stopping frontend (pid $FRONT_PID)"
  kill "$FRONT_PID" || true
fi
if [ "$API_STARTED" -eq 1 ] && [ "$API_PID" -ne 0 ]; then
  echo "Stopping API (pid $API_PID)"
  kill "$API_PID" || true
fi

exit $EXIT_CODE
