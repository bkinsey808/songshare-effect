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
## Helper: probe dev endpoints to see if services are already up.
probe_url() {
	# Probe a single URL. For HTTPS allow insecure certs (mkcert/self-signed).
	local url="$1"
	if [[ "$url" == https:* ]]; then
		curl -sSk --max-time 2 "$url" >/dev/null 2>&1
	else
		curl -sS --max-time 2 -I "$url" >/dev/null 2>&1
	fi
}

probe_frontend() {
	# Try HTTPS first, then HTTP as a fallback. Return success (0) if either responds.
	probe_url "https://127.0.0.1:5173" || probe_url "http://127.0.0.1:5173" || \
		probe_url "https://localhost:5173" || probe_url "http://localhost:5173"
}

is_port_listening() {
	local port=5173
	# Try ss, then netstat, then nc as fallback.
	if command -v ss >/dev/null 2>&1; then
		ss -ltn 2>/dev/null | grep -q ":${port}" && return 0 || return 1
	elif command -v netstat >/dev/null 2>&1; then
		netstat -ltn 2>/dev/null | grep -q ":${port}" && return 0 || return 1
	elif command -v nc >/dev/null 2>&1; then
		nc -z localhost "${port}" >/dev/null 2>&1 && return 0 || return 1
	else
		return 1
	fi
}

probe_api() {
	probe_url "http://127.0.0.1:8787" || probe_url "http://localhost:8787"
}

echo "Starting frontend (dev:client) -> logs: $CLIENT_LOG"

if probe_frontend && probe_api; then
	echo "Detected existing dev servers on 5173 and 8787; reusing them. Marking ready and tailing logs."
	# Ensure log files exist so tail doesn't fail.
	: >"$CLIENT_LOG" || true
	: >"$API_LOG" || true
	# Print a short ready marker so Playwright sees the command produced output
	# and knows the wrapper is alive. Then keep tailing logs so the wrapper stays
	# running until Playwright finishes the test run and kills it.
	echo "PLAYWRIGHT_WRAPPER: READY"
	tail -n +1 -f "$CLIENT_LOG" "$API_LOG"
	exit 0
fi

if probe_frontend; then
	echo "Frontend already listening on 5173; will not start a new vite instance"
	FRONT_PID=0
else
	npm run dev:client >"$CLIENT_LOG" 2>&1 &
	FRONT_PID=$!
fi

echo "Starting API (wrangler dev) -> logs: $API_LOG"
if probe_api; then
	echo "API already listening on 8787; will not start a new wrangler instance"
	API_PID=0
else
	pushd api >/dev/null
	env CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}" npx wrangler dev --no-enable-containers --env dev >"$API_LOG" 2>&1 &
	API_PID=$!
	popd >/dev/null
fi

echo "Frontend PID: $FRONT_PID, API PID: $API_PID"

# Build a list of PIDs to wait on (only include non-zero PIDs we started).
PIDS_TO_WAIT=()
if [ -n "${FRONT_PID:-}" ] && [ "$FRONT_PID" -ne 0 ]; then
	PIDS_TO_WAIT+=("$FRONT_PID")
fi
if [ -n "${API_PID:-}" ] && [ "$API_PID" -ne 0 ]; then
	PIDS_TO_WAIT+=("$API_PID")
fi

if [ ${#PIDS_TO_WAIT[@]} -eq 0 ]; then
	# We did not start any processes (we're reusing existing servers). Keep the
	# wrapper alive by tailing logs; Playwright will kill this process when done.
	tail -n +1 -f "$CLIENT_LOG" "$API_LOG"
	exit 0
fi

# Wait for frontend readiness. First try to detect Vite's "Local:" startup
# marker in the client log (more reliable during startup), then fall back to
# probing HTTP/HTTPS endpoints. If the frontend does not become ready within
# the timeout, print logs and exit non-zero so Playwright fails fast.
WAIT_SECONDS=${WAIT_SECONDS:-60}
echo "Waiting up to ${WAIT_SECONDS}s for frontend to become ready (checking client log then probing)..."
start_time=$(date +%s)
ready=1
while [ $(( $(date +%s) - start_time )) -lt $WAIT_SECONDS ]; do
	# Check client log for Vite's Local URL marker using a follow+timeout so
	# we don't miss the string if it appears after we start polling.
	if command -v timeout >/dev/null 2>&1 && [ -f "$CLIENT_LOG" ]; then
		# Use timeout on the whole shell pipeline to ensure tail is killed when
		# timeout expires. Some timeout implementations expect a unit suffix.
	if timeout "${WAIT_SECONDS}s" sh -c "tail -n +1 -f '$CLIENT_LOG' 2>/dev/null | grep -m1 -E 'Local:.*5173'" >/dev/null 2>&1; then
			# We saw Vite's Local line in the log. Ensure the port is
			# actually listening before claiming readiness to avoid
			# a race where the log is flushed before the socket opens.
			if is_port_listening; then
				ready=0
				break
			else
				echo "Detected Vite Local log line but port 5173 not listening yet; continuing to wait..."
			fi
		fi
	else
		# Fallback to simple grep if timeout is unavailable
		if [ -f "$CLIENT_LOG" ] && grep -E "Local:.*5173" "$CLIENT_LOG" >/dev/null 2>&1; then
			ready=0
			break
		fi
	fi

	# Fallback to probing network endpoints
	if probe_frontend; then
		ready=0
		break
	fi

	sleep 0.5
done

if [ $ready -ne 0 ]; then
	echo "Frontend did not become ready within ${WAIT_SECONDS}s. Collecting diagnostics and tailing logs for debugging..."
	echo
	echo "=== Environment ==="
	echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL:-<unset>}"
	echo "LOG_DIR=${LOG_DIR:-/tmp}"
	if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then echo "CLOUDFLARE_API_TOKEN=<set>"; else echo "CLOUDFLARE_API_TOKEN=<unset>"; fi
	echo
	echo "=== Listening ports (ss/netstat/nc) ==="
	if command -v ss >/dev/null 2>&1; then
		ss -ltnp 2>/dev/null | sed -n '1,200p'
	elif command -v netstat >/dev/null 2>&1; then
		netstat -ltnp 2>/dev/null | sed -n '1,200p'
	else
		echo "(ss/netstat not available)"
	fi
	echo
	echo "=== Processes we started (PIDs) ==="
	for pid in "${PIDS_TO_WAIT[@]}"; do
		if [ -n "$pid" ] && [ "$pid" -ne 0 ]; then
			ps -fp "$pid" || true
		fi
	done
	echo
	echo "--- $CLIENT_LOG (last 200 lines) ---"
	tail -n 200 "$CLIENT_LOG" || true
	echo "--- $API_LOG (last 200 lines) ---"
	tail -n 200 "$API_LOG" || true
	# Kill any processes we started
	for pid in "${PIDS_TO_WAIT[@]}"; do
		if [ -n "$pid" ] && [ "$pid" -ne 0 ]; then
			kill "$pid" 2>/dev/null || true
		fi
	done
	exit 1
fi

echo "PLAYWRIGHT_WRAPPER: READY"

# If frontend became ready, now wait on the started PIDs so the wrapper stays
# alive until Playwright finishes the run. If any exits, capture exit code and
# then print logs for debugging before returning that code.
for pid in "${PIDS_TO_WAIT[@]}"; do
	wait "$pid" || EXIT_CODE=$?
done

EXIT_CODE=${EXIT_CODE:-0}
echo "One of the dev processes exited (exit code: $EXIT_CODE). Tailing logs for debugging..."
echo "--- $CLIENT_LOG ---"
tail -n +1 "$CLIENT_LOG" || true
echo "--- $API_LOG ---"
tail -n +1 "$API_LOG" || true

exit $EXIT_CODE
