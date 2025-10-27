#!/usr/bin/env bash
set -euo pipefail

# Wrapper to start frontend and API for Playwright in a non-interactive way.
# This starts the frontend dev server and the Cloudflare Workers dev server
# (wrangler) in the background and waits on both PIDs. Logs are written to
# /tmp so Playwright can see the services come up without interactive prompts.

LOG_DIR=${LOG_DIR:-/tmp}
CLIENT_LOG="$LOG_DIR/playwright-dev-client.log"
API_LOG="$LOG_DIR/playwright-dev-api.log"

echo "Starting frontend (dev:client) -> logs: $CLIENT_LOG"
npm run dev:client >"$CLIENT_LOG" 2>&1 &
FRONT_PID=$!

echo "Starting API (wrangler dev) -> logs: $API_LOG"
# Run wrangler in the api/ directory. Honor CLOUDFLARE_API_TOKEN if present.
(cd api && env CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}" npx wrangler dev --no-enable-containers --env dev >"$API_LOG" 2>&1 &) 
API_PID=$!

echo "Frontend PID: $FRONT_PID, API PID: $API_PID"

# Wait for both processes. If either exits, propagate its exit code.
wait -n $FRONT_PID $API_PID
EXIT_CODE=$?

echo "One of the dev processes exited with code $EXIT_CODE. Tailing logs for debugging..."
echo "--- $CLIENT_LOG ---"
tail -n +1 "$CLIENT_LOG" || true
echo "--- $API_LOG ---"
tail -n +1 "$API_LOG" || true

exit $EXIT_CODE
