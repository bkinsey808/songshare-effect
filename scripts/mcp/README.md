# MCP scripts

This folder contains MCP (Chrome DevTools MCP / CDP) utilities used to:

- launch Chrome with a remote debugging port for local development;
- run a local MCP server (`chrome-devtools-mcp`) to bridge clients to Chrome;
- capture Console and Network events for debugging, demoing, and CI checks.

These tools are for trusted development environments only. Do not run them on
production hosts or expose the debug port to untrusted networks.

## File reference

Below is a short description and usage notes for every file currently present
in this directory. If you add/remove scripts, please keep this README in sync.

- `MCP_BROWSER_EXAMPLES.js`
  - Purpose: Browser-side example snippets (auth inspection, state checks,
    network hooks, performance checks). Intended to be copy/pasted into the
    DevTools console or injected via an MCP client.

- `README.md`
  - Purpose: This file (you are reading it).

- `capture-cdp.js`
  - Purpose: Node.js CDP capture harness. Connects to a CDP websocket and
    streams Console + Network events for a configured duration.
  - Usage: `node scripts/mcp/capture-cdp.js <webSocketDebuggerUrl> [durationMs]`

- `capture-cdp.sh`
  - Purpose: Shell wrapper that finds the app tab's `webSocketDebuggerUrl`
    (searches for `DEV_SERVER_URL`) and invokes `capture-cdp.js`.
  - Usage: `./scripts/mcp/capture-cdp.sh [durationMs]`

- `capture-console.js`
  - Purpose: Lightweight console capture helper used by demos and quick tests.
  - Usage: Internal helper; typically invoked by other scripts.

- `capture-network-debug.js`
  - Purpose: Puppeteer-based capture alternative which launches a headless
    Chromium and captures console and page events. Useful for CI or when a
    full browser context is required.
  - Usage: `node scripts/mcp/capture-network-debug.js <appUrl>`

- `demo-console-logs.sh`
  - Purpose: Demo script that triggers a set of console logs in the app to
    exercise console-capture tooling and examples.
  - Usage: `./scripts/mcp/demo-console-logs.sh`

- `mcp-npx-wrapper.sh`
  - Purpose: Robust wrapper around `npx` which ensures a usable `npx` is
    available and runs `chrome-devtools-mcp` without requiring a global
    install.
    - Usage: Called by npm aliases (e.g., `npm run mcp:start`); can be used
      directly to run `chrome-devtools-mcp` via the repo.

- `mcp.log`
  - Purpose: Runtime log file created by `start-mcp.sh` when the MCP server is
    backgrounded. This file is generated at runtime and is intentionally not
    tracked as a source file; leave it alone.

- `read-chrome-console.js`
  - Purpose: Node helper to connect to a WebSocketDebuggerUrl and print
    console messages in a readable format. Useful for integrating with other
    tooling or producing structured output.

- `read-console-logs.sh`
  - Purpose: Shell wrapper to tail or process console capture output.

- `simple-console-reader.sh`
  - Purpose: Minimal console reader used for quick local checks and demos.

- `start-chrome-debug-secure.sh`
  - Purpose: Launches Chrome/Chromium with flags suitable for secure local
    debugging: binds to `127.0.0.1`, avoids `--disable-web-security`, and
    uses a dedicated user-data directory.
  - Usage: `./scripts/mcp/start-chrome-debug-secure.sh`

- `start-chrome-debug.sh`
  - Purpose: Launches Chrome with more permissive development flags (e.g.
    `--disable-web-security`) to simplify local testing (CORS, etc.). Use
    this in strictly local/dev environments only.
  - Usage: `./scripts/mcp/start-chrome-debug.sh`

- `start-mcp.sh`
  - Purpose: Backgrounds a `chrome-devtools-mcp` process and writes
    `scripts/mcp/mcp.pid` and `scripts/mcp/mcp.log` for lifecycle management.
  - Usage: `./scripts/mcp/start-mcp.sh` (npm alias: `npm run mcp:start`)

- `stop-mcp.sh`
  - Purpose: Gracefully stops the MCP server. Prefer pidfile shutdown; when
    invoked with `--kill-chrome` it will also attempt to stop the Chrome
    instance started by the start script.
  - Usage: `./scripts/mcp/stop-mcp.sh [--kill-chrome]` (npm alias: `npm run mcp:stop`)

- `test-chrome-mcp.sh`
  - Purpose: Connectivity/health check for the Chrome debug endpoint. Verifies
    tabs are present and that a WebSocketDebuggerUrl is available; runs a
    small CDP check if Node is present.
  - Usage: `./scripts/mcp/test-chrome-mcp.sh` (npm alias: `npm run chrome:test`)

- `test-console-logs.sh`
  - Purpose: Console injection and capture smoke-test. Enables Console &
    Runtime domains, injects test logs, and reports captured messages. Prefers
    Node and requires `jq` for robust tab selection.
  - Usage: `./scripts/mcp/test-console-logs.sh` (npm alias: `npm run chrome:test:console`)

## Notes & best practices

- These scripts are development-only helpers. Never run them on production or
  on networks you don't control.
- Prefer `start-chrome-debug-secure.sh` for multi-user machines. It binds the
  debug server to localhost and avoids the more dangerous flags.
- `mcp.log` is intentionally a runtime file — do not commit it. If you find
  it tracked in Git, remove it from the index and add `scripts/mcp/mcp.log` to
  `.gitignore`.

If you want, I can also:

- convert these helpers into a small Node CLI for consistency;
- prefer `*.bun.ts` scripts and run them using `bun` when possible. Many of the
  modern scripts in this repository use Bun TypeScript files (`*.bun.ts`) for
  faster startup and better compatibility with BI/kit. Node-based scripts are
  still available but may be removed in the future in favor of Bun scripts.
- add a short usage README alongside each script with examples;
- prepare a single `npm run mcp:all` orchestration that starts MCP and Chrome
  with sensible defaults.

## Copilot / automation instructions

This section is intended for automation or Copilot-style tools that will be
managing the MCP/dev debugging flow. Below are concrete package.json scripts
and shell commands the assistant (or a human) should run for common tasks.

Core package.json scripts (preferred)

- `npm run dev:mcp` — Start Chrome (debug mode), MCP server, and dev servers.
  - Backgrounds the dev servers and starts a background monitor that writes
    combined logs to `/tmp/monitor.log` and records its PID at
    `/tmp/dev-mcp-monitor.pid`.

- `npm run dev:mcp:stop` — Stop MCP/Chrome and dev servers (best-effort).

- `npm run dev:mcp:clear-log` — Truncate `/tmp/monitor.log` without stopping
  the monitor. Useful to get a clean log before reproducing a bug.

- `npm run dev:monitor:tail` — Tail the combined monitor interactively:
  `tail -n 200 -f /tmp/monitor.log`.

- `npm run dev:monitor:status` — Print monitor PID and process info.

- `npm run dev:mcp:restart` — Convenience: stop then start the full flow.

Recommended Copilot workflow (one-liner style)

1. Stop existing dev flow and ensure a clean log:

   npm run dev:mcp:stop && npm run dev:mcp:clear-log

2. Start the full dev flow (Chrome, MCP, dev servers and background monitor):

   npm run dev:mcp

3. While the user reproduces an issue, stream the monitor and call out
   relevant lines (Set-Cookie headers, /api/me requests and responses, 401/200):

   npm run dev:monitor:tail

4. If the log gets noisy, truncate it during the session without stopping
   the monitor:

   npm run dev:mcp:clear-log

## Notes and automation hints

- Always prefer the `npm run` scripts above to custom ad-hoc shell lines so
  that behavior stays consistent across environments.

- The monitor is a simple `tail -F` background job; it will continue running
  across `dev:mcp` restarts unless its pidfile is removed. Use
  `npm run dev:monitor:status` to check and `kill $(cat /tmp/dev-mcp-monitor.pid)`
  to stop it if needed.

- For auth/cookie debugging specifically: the assistant should watch for
  `Set-Cookie` lines in the monitor and confirm the following during a
  sign-in reproduction:
  - The OAuth callback response includes a `Set-Cookie: userSession=...` line.
  - A subsequent request to `/api/me` includes `Cookie: userSession=...`.
  - If `/api/me` logs `No session token found`, the cookie was not sent by
    the browser and you should try the Vite proxy or adjust cookie attributes
    only for local dev.

- If a port conflict is reported (e.g. ports 5173 or 8787 already in use),
  prefer to stop the running dev process via `npm run dev:mcp:stop` before
  trying to start again. If that doesn't work, `lsof -i :5173` / `lsof -i :8787`
  can help identify owners; the assistant should avoid force-killing unrelated
  user processes unless explicitly asked.

Troubleshooting checklist (short)

1. Monitor PID missing or stale: `rm -f /tmp/dev-mcp-monitor.pid` and then
   `npm run dev:mcp` will recreate it.
2. No `userSession` cookie present after OAuth callback:
   - Ensure the frontend makes requests with credentials: the code uses
     `fetch('/api/me', { credentials: 'include' })`.
   - Use the Vite proxy (already configured) so both client and API are
     same-origin during dev. If `dev:mcp` was started before the proxy was
     added, restart with `npm run dev:mcp:restart`.
3. If MCP logs show `Permission denied` for `mcp-npx-wrapper.sh`, ensure the
   wrapper is executable: `chmod +x scripts/mcp/mcp-npx-wrapper.sh`.

If you want, I can also generate a small checklist script that automates the
above verification steps (e.g., check monitor PID, tail for Set-Cookie, run
curl /api/me) and print a compact summary.
