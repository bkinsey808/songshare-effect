# MCP Script Reference

This page documents all MCP (Chrome DevTools Model Context Protocol) related scripts in this repo and the npm scripts that wrap them. Use this as a quick reference when debugging with DevTools / MCP.

Table of contents
-----------------

- Quickstart (minimal)
- Guide / How-to
- Files and scripts
- npm scripts
- PID & logs
- Examples
- Troubleshooting


Quickstart (minimal)
--------------------

1) Start the MCP server (backgrounded) and wait until ready:

```bash
npm run mcp:start
npm run mcp:wait
```

2) Start secure Chrome (opens the app URL):

```bash
npm run chrome:debug:secure
```

3) Run console capture or tracing tests:

```bash
npm run chrome:test:console
npm run debug:cdp-capture -- 30000
```

4) Stop MCP and Chrome when done:

```bash
npm run mcp:stop        # accepts -- --kill-chrome when using npm to forward args
```

This quickstart is a compact copy of the longer guide. The full guide and reference are on this page.

Guide / How-to
---------------

# Chrome Dev Tools MCP — Guide

## Overview

This guide shows you how to use Chrome Dev Tools MCP with your songshare-effect project in a WSL2 (or other) development environment.

## Quick Start (expanded)

1. Start MCP and wait (recommended):

```bash
npm run mcp:start
npm run mcp:wait
```

2. Start Chrome with debugging enabled (secure example):

```bash
npm run chrome:debug:secure
```

3. Start your dev servers:

```bash
npm run dev:all
```

4. Connect your MCP client to:

- Debug Endpoint: `http://localhost:9222`
- WebSocket: `ws://localhost:9222`

## MCP Integration with Copilot / MCP clients

If you use Claude Desktop, Gemini CLI or other MCP-aware tools, add an MCP server entry that points to `chrome-devtools-mcp` on the chosen port (default 9222). Example config (client-specific):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "chrome-devtools-mcp",
      "args": ["--port", "9222"]
    }
  }
}
```

### Manual MCP commands (CLI)

You can programmatically inspect Chrome's debug endpoints:

```bash
# List open tabs
curl http://localhost:9222/json

# Chrome version info
curl http://localhost:9222/json/version

# Use the webSocketDebuggerUrl from the tabs list to connect via a WebSocket client
```

## Common use cases for songshare-effect

- Authentication flow testing (observe localStorage, network requests).
- API debugging for the Hono backend (http://localhost:8787).
- React component inspection via DevTools hooks.
- Performance tracing using the DevTools Performance domain.

Example snippets and workflows are useful to copy into MCP-driven automation or ad-hoc shell helpers.

## WSL2-specific notes

- WSL2 forwards localhost ports to Windows: your React app (often on `localhost:5173` or configured `DEV_SERVER_PORT`) and the Chrome debug port (`9222`) are reachable from both sides.
- The start scripts detect Chrome on Windows (`/mnt/c/.../chrome.exe`) and on Linux (`google-chrome` / `chromium-browser`).
- If you run Chrome inside WSL2 you may need an X11/display setup.

### WSL gotchas: Chrome's remote-debugging port may not be reachable from WSL

Observed problem

- When launching Windows Chrome from inside WSL (for example the binary under `/mnt/c/.../chrome.exe`), Chrome sometimes binds the DevTools remote-debugging port to the Windows loopback in a way that's not reachable from the WSL network namespace. The start script may print a DevTools websocket URL (for example `ws://127.0.0.1:9222/...`) while `curl http://127.0.0.1:9222/json/version` executed in WSL still fails with "Connection refused".

Why this matters

- The capture helpers (for example `scripts/mcp/capture-cdp.sh`) run from WSL and query the local debug HTTP endpoint (`/json` and `/json/version`) to locate the webSocketDebuggerUrl. If the endpoint is unreachable from WSL, captures will produce no network events and report "No tabs found" or save an empty capture file.

What I changed and the recommended workflows

1. Optional helper flag (lightweight, non-breaking)

  - I added support for `USE_LINUX_CHROME=1` in the `scripts/mcp/start-chrome-debug.sh` script. When set, the script will prefer running a Linux Chrome/Chromium binary installed inside WSL (if available) instead of a Windows Chrome binary. Launching the Linux browser from WSL ensures the debug port is bound in the WSL network namespace and is reachable by the capture scripts.

2. Recommended ways to launch Chrome so MCP can reliably capture CDP events

  - Preferred (use this when you have a Linux Chrome/Chromium in WSL and X/WSLg available):

    ```bash
    # ensure helper scripts are executable (one-time)
    chmod +x ./scripts/mcp/start-chrome-debug.sh ./scripts/mcp/capture-cdp.sh

    # prefer the Linux browser so the debug port binds to WSL
    USE_LINUX_CHROME=1 nohup ./scripts/mcp/start-chrome-debug.sh > /tmp/chrome-debug.log 2>&1 &

    # wait for the debug endpoint (poll)
    for i in {1..15}; do curl -sS http://127.0.0.1:9222/json/version && break || sleep 1; done

    # when ready, run a short capture (duration in ms)
    DEV_SERVER_PORT=5173 ./scripts/mcp/capture-cdp.sh 30000 > /tmp/cdp-capture.json
    ```

  - Alternate (if you prefer Windows Chrome):

    - Launch Chrome from native Windows (outside WSL) with `--remote-debugging-port=9222` so the debug port is reachable from Windows tools. If you still want to run capture from WSL, you may need to connect to the Windows host IP that exposes the debug endpoint (this approach is more fragile).

3. If the start script appears to "hang"

  - This is expected behavior for the helper: `start-chrome-debug.sh` launches Chrome and then `wait`s for the Chrome PID so it can clean up the pidfile/logs on exit. Run it in a background job (or use the VS Code background task that's included in this repo) if you need your shell back.

  - Examples:

    ```bash
    # background the script and write its output to a logfile
    nohup ./scripts/mcp/start-chrome-debug.sh > /tmp/chrome-debug.log 2>&1 &

    # or use the workspace VS Code task (preferred for interactive flows)
    # - Start Chrome Debug (background task)
    ```

4. Permissions and binaries

  - Make sure the scripts are executable: `chmod +x ./scripts/mcp/*.sh`.
  - Verify a Linux Chrome/Chromium exists in WSL: `command -v google-chrome || command -v chromium-browser`.
  - If you use WSLg (graphical support) ensure `DISPLAY` or Wayland variables are present (the start script will open a visible browser when a Linux binary is chosen).

5. If a capture shows console messages but zero network events

  - Confirm Chrome's `Network` domain is enabled by the capture script. The repository capture helper explicitly enables `Network` via CDP; if you still see zero network entries, the helper may have connected to the wrong CDP websocket (for example, a DevTools frontend page instead of your app tab). Set `DEV_SERVER_PORT` / `DEV_SERVER_URL` to the port your dev server actually uses so the script matches the correct tab.

Useful quick checks

```bash
# check debug endpoint
curl http://127.0.0.1:9222/json/version

# list tabs and ws urls
curl http://127.0.0.1:9222/json

# check which port your frontend landed on
ss -ltnp | egrep ':(5173|5174|5175) '

# run a 30s capture (override port if needed)
DEV_SERVER_PORT=5175 ./scripts/mcp/capture-cdp.sh 30000 > /tmp/cdp-capture.json
```

If you'd like, I can also add a short example `npm` alias or a VS Code task that runs the recommended `USE_LINUX_CHROME=1` flow so you don't have to remember the flags.

## Troubleshooting

- Chrome won't start: kill existing Chrome processes and clear the debug user-data dir used by the start scripts.
- Debug port not accessible: `lsof -i :9222` and `curl http://localhost:9222/json/version` are quick checks.
- CORS: the start scripts use `--disable-web-security` for development convenience; remove that flag for production testing.

## Security

### Chrome DevTools MCP Security Guide — summary

Chrome DevTools MCP provides powerful debugging capabilities but requires careful security considerations. The following guidance outlines risks, mitigations, and best practices for running MCP and launching Chrome with a remote-debugging port.

### Risk assessment

High risk (do not do in these cases):

- Production use: NEVER enable remote-debugging in production.
- Public networks: do not expose the debug port on public interfaces.
- Shared machines: avoid leaving debug ports open on multi-user systems.
- Sensitive data: avoid loading production credentials or real user data in debug profiles.

Medium risk:

- Corporate/shared development networks where other hosts can reach the debug port.
- Long-running debug sessions that increase exposure window.
- Multiple applications sharing the same debug port or profile.

Low risk (acceptable):

- Local development on an isolated device with debug bound to localhost.
- Temporary, short-lived sessions using test data only.

### Security configurations

Strict Security Mode (recommended):

```bash
# Use the secure script
./scripts/start-chrome-debug-secure.sh

# Or set environment variable
export CHROME_MCP_SECURITY=strict
npm run chrome:debug
```

Features:

- Binds to 127.0.0.1 only (not 0.0.0.0)
- Removes `--disable-web-security` flag
- Restricted file permissions on profile directory
- Production environment detection and network interface validation

Development Mode (less strict):

```bash
export CHROME_MCP_SECURITY=dev
./scripts/start-chrome-debug-secure.sh
```

Features:

- Includes `--disable-web-security` for CORS testing (development convenience)
- More permissive for local workflows, but still binds to localhost by default

### What MCP can access

Browser content:

- HTML, CSS, JavaScript loaded in the page
- DOM structure and element properties
- Console messages and JavaScript errors
- Network requests and responses
- LocalStorage, SessionStorage, cookies, IndexedDB

System-level interactions via the browser:

- Execute JavaScript in the page context
- Navigate pages, take screenshots, record media
- Modify page content/styles and simulate user input

What it cannot access:

- Files outside the browser sandbox, OS processes, or other applications
- Network traffic from other processes
- Other browser profiles or OS-level functions

### Threats & mitigations

- Unauthorized access: ensure remote debugging binds to localhost only. Use `--remote-debugging-address=127.0.0.1`.
- Data exposure: use an isolated debug profile (`--user-data-dir="$HOME/.chrome-debug-profile-secure"`) and avoid real data.
- Cross-site attacks: remove `--disable-web-security` in strict mode.
- Process hijacking: ensure automated sessions use proper cleanup and timeouts (trap/killing logic in start/stop scripts).

### Best practices

- Environment separation: use a separate user-data dir for debug sessions, never your main Chrome profile.
- Network security: bind debug to localhost, never 0.0.0.0.
- Data handling: only use test data in debug profiles.
- Session management: kill debug processes when done and time-limit automated sessions.

### Secure development workflow (short)

1. Start secure debug session:

```bash
./scripts/start-chrome-debug-secure.sh
```

2. Connect MCP clients only to localhost endpoints (e.g., `ws://127.0.0.1:9222`).

3. Monitor and log access (tail logs, lsof/netstat) while the session runs.

4. Clean up: kill debug processes and remove debug profiles when finished.

### Environment variables

```bash
# Security mode (strict|dev)
export CHROME_MCP_SECURITY=strict

# Custom debug port
export CHROME_DEBUG_PORT=9223

# Custom profile directory
export CHROME_DEBUG_PROFILE="$HOME/.secure-debug"

# Enable additional logging
export CHROME_DEBUG_LOG=true
```

### Emergency procedures

If you suspect compromise or accidental exposure:

1. Kill Chrome debug processes: `pkill -f "chrome.*remote-debugging"`.
2. Check for suspicious connections: `netstat -an | grep :9222` and `lsof -i :9222`.
3. Clear debug profiles: `rm -rf ~/.chrome-debug-profile*`.
4. Restart with a clean profile if needed.

### Security checklist

Before starting a debug session:

- Confirm you're on a development environment only
- Verify no production data is accessible
- Ensure network isolation

During the session:

- Monitor for unauthorized access attempts
- Keep session duration minimal
- Avoid handling sensitive data

After the session:

- Kill Chrome debug process and clear debug profile
- Review logs for any suspicious activity

---

## Example MCP workflows

1. Monitor authentication:

```bash
# Start Chrome and servers
npm run chrome:debug:secure
npm run dev:all

# Use your MCP client to monitor network and console events
```

2. Performance monitoring and language switching examples are well covered by the snippets in the original guide and can be executed via MCP console commands.

## VS Code Tasks

If you want a VS Code task to start Chrome with debug enabled (background), use this command in `.vscode/tasks.json` and point it at `scripts/mcp/start-chrome-debug-secure.sh` or run the npm alias `npm run chrome:debug:secure`.

## Package.json snippets

Prefer the npm aliases added to this repo that manage pidfiles and logs:

```json
{
  "scripts": {
    "mcp:start": "./scripts/mcp/start-mcp.sh",
    "mcp:stop": "./scripts/mcp/stop-mcp.sh",
    "chrome:debug:secure": "./scripts/mcp/start-chrome-debug-secure.sh"
  }
}
```

## Next steps

- Install an MCP client, write automation scenarios, and use MCP to automate testing and performance monitoring.

---

---

## Chrome DevTools MCP — Debugging Guide

This section describes how to use Chrome DevTools + MCP (Model Context Protocol)
to inspect and debug the `songshare-effect` app during development.

Goals
- Start the frontend and API dev servers
- Launch Chrome with remote debugging enabled
- Start the MCP server (`chrome-devtools-mcp`) so MCP-aware clients (or tools) can connect
- Capture Console and Network events via the DevTools Protocol (CDP)

Quick commands

- Start frontend + API + Chrome (secure) + MCP (recommended interactive flow):

```bash
npm run dev:debug
```

- Start Chrome only (secure, binds DevTools to localhost:9222):

```bash
npm run chrome:debug:secure
```

- Start the MCP server only (useful for editor integrations):

```bash
npm run mcp:start
```

- Run the repository console-capture test (injects console messages and prints captured output):

```bash
npm run chrome:test:console
```

- Stream Console + Network events (CDP capture helper):

```bash
npm run debug:cdp-capture -- 15000
# optional numeric argument is capture duration in ms (default 15000)
```

What the tools do
- `chrome:debug:secure` — launches Chrome with safe flags and binds the remote debugging port to `127.0.0.1:9222`.
- `mcp:start` — runs `chrome-devtools-mcp` to expose the Chrome instance to MCP clients (note: this tool can be interactive; prefer running it in a terminal you monitor).
- `chrome:test:console` — small test harness that connects directly to Chrome's CDP WebSocket for your app tab, injects console statements, and prints captured messages.
- `debug:cdp-capture` — convenience wrapper around a Node CDP capture script that streams Console and Network events for a short period.

WSL / Windows notes
- If you develop inside WSL, ensure the browser you launch exposes the DevTools port to the WSL network stack:
  - Option A: Launch Chrome on Windows with `--remote-debugging-port=9222` (recommended if you use Windows Chrome).
  - Option B: Install a Linux Chromium inside WSL (requires `systemd` + `snapd`); see docs and script notes earlier in this repo.

Security
- The MCP server and Chrome DevTools expose a lot of browser internals. Only run these tools in trusted development environments.
- Never enable remote debugging on a public interface or in production.

Troubleshooting
- If `curl http://127.0.0.1:9222/json` shows no data, Chrome's remote-debugging port is not listening. Ensure Chrome was launched with the `--remote-debugging-port` flag.
- If `mcp:start` prints a banner and exits, run it in a dedicated terminal (it may expect an interactive session) or use `nohup`/`tmux` to keep it alive.
- If the CDP capture prints `No tabs found`, ensure the dev server is running and that the app URL matches the URL looked for by the helper scripts (default is `http://localhost:5173`). Set `DEV_SERVER_PORT` or `DEV_SERVER_URL` environment variables to override.

Automating in CI
- For CI-friendly tests, prefer headless Playwright/Puppeteer-based tests that download their own browser binary and use CDP directly. This repo includes `puppeteer` as a dev dependency and could be wired into automated tests.

Cleanup and maintenance
- Temporary capture scripts used during local debugging were consolidated into `scripts/capture-cdp.cjs` and an npm script `debug:cdp-capture` was added to make ad-hoc capture simple.

If you want, I can:
- Add a VS Code launch configuration that attaches an MCP client to chrome-devtools-mcp.
- Add a Playwright-based CI test that validates console/network flows without depending on host Chrome.

End of guide section.

Top-level notes
- Default Dev server URL used by scripts: `http://localhost:5173` (override with `DEV_SERVER_PORT` or `DEV_SERVER_URL`).
- Chrome DevTools remote-debugging port used: `9222` (override with `CHROME_DEBUG_PORT`).
- Always run these tools in a trusted development environment; MCP exposes browser internals.


Files and scripts

All MCP-related helper scripts live under `scripts/mcp/`.

`scripts/mcp/mcp-npx-wrapper.sh`
- Purpose: Robust wrapper to locate a usable `npx` and exec commands through it.
- Usage: called by npm scripts to run `chrome-devtools-mcp` without requiring a global install.
- Example: `./scripts/mcp/mcp-npx-wrapper.sh --no-install chrome-devtools-mcp serve --port 9222 --address localhost`

`scripts/mcp/start-chrome-debug.sh`
- Purpose: Launches Chrome (Windows or Linux) with remote debugging flags (less strict) and opens the app URL.
- Key env: `DEV_SERVER_PORT` (default `5173`), `CHROME_DEBUG_PORT` (default `9222`).
- Usage: `./scripts/mcp/start-chrome-debug.sh` or npm `npm run chrome:debug`.

`scripts/mcp/start-chrome-debug-secure.sh`
- Purpose: Launches Chrome with a more secure flag set (binds debug to localhost only) and restricted user-data dir.
- Use this in multi-user or sensitive environments.
- Usage: `./scripts/mcp/start-chrome-debug-secure.sh` or npm `npm run chrome:debug:secure`.

`scripts/mcp/test-chrome-mcp.sh`
- Purpose: Quick checks for the Chrome debug endpoint and available tabs. Also includes a small CDP test when Node is available.
- It does not launch the MCP server itself — it's a connectivity/health check for DevTools.
- Usage: `./scripts/mcp/test-chrome-mcp.sh` or npm `npm run chrome:test`.

`scripts/mcp/test-console-logs.sh`
- Purpose: Injection-based console capture test. Connects to the app tab via CDP, enables Console and Runtime, injects `console.log/warn/error/info`, and prints captured messages.
- Requires `jq` for robust tab selection and Node (the script falls back to a curl-based injection if Node isn't available).
- Usage: `./scripts/mcp/test-console-logs.sh` or npm `npm run chrome:test:console`.

Auxiliary utilities
- `scripts/mcp/read-chrome-console.js`, `scripts/mcp/read-console-logs.sh`, `scripts/mcp/simple-console-reader.sh` — auxiliary utilities for reading console logs and interacting with the DevTools endpoint.

Capture tools
- `scripts/mcp/capture-cdp.cjs` — Node script that connects directly to a CDP websocket and streams Console + Network events for a configurable duration.
  - Usage: `node scripts/mcp/capture-cdp.cjs <webSocketDebuggerUrl> [durationMs]`.
- `scripts/mcp/capture-cdp.sh` — wrapper which automatically finds the app tab's `webSocketDebuggerUrl` (looking for `DEV_SERVER_URL`) and runs `capture-cdp.cjs`.
  - Usage: `./scripts/mcp/capture-cdp.sh [durationMs]` or via npm `npm run debug:cdp-capture -- 30000`.

`scripts/mcp/demo-console-logs.sh`
- Purpose: Example/demo script used to produce console outputs for demonstration or quick visual checks.


npm scripts (package.json)
- `npm run mcp:start` — start MCP in background and write `scripts/mcp/mcp.pid` + `scripts/mcp/mcp.log`.
- `npm run mcp:stop` — stop MCP; prefers PID-file shutdown (`scripts/mcp/mcp.pid`) and supports `--kill-chrome` to also stop the browser started by the paired start scripts.
- `npm run mcp:restart` — stop then start (quick restart helper).
- `npm run mcp:status` — show MCP pid and query `http://localhost:9222/json` when running.
- `npm run mcp:logs` — tail the MCP log (`scripts/mcp/mcp.log`).
- `npm run mcp:wait` — wait for MCP's debug endpoint to become available (useful in scripts/CI).
- `npm run mcp:start` — start the MCP server (`chrome-devtools-mcp`) in the background (writes pid/log).
- `npm run chrome:debug` — start Chrome (insecure-less strict mode) via `scripts/mcp/start-chrome-debug.sh`.
- `npm run chrome:debug:secure` — start secure Chrome via `scripts/mcp/start-chrome-debug-secure.sh`.
- `npm run chrome:stop` — stop the Chrome instance started by the start scripts (reads `~/.local/share/songshare-effect/chrome.pid`).
- `npm run chrome:test:console` — runs `scripts/mcp/test-console-logs.sh` (console injection test).
- `npm run chrome:test` — runs `scripts/mcp/test-chrome-mcp.sh` (connectivity test).
- `npm run debug:cdp-capture` — convenience script (calls `./scripts/mcp/capture-cdp.sh`) to stream Console+Network events.


Which scripts to keep
- Keep (recommended):
  - `scripts/mcp/start-chrome-debug-secure.sh`, `scripts/mcp/start-chrome-debug.sh` (Chrome launchers)
  - `scripts/mcp/mcp-npx-wrapper.sh` (robust npx wrapper)
  - `scripts/mcp/test-console-logs.sh`, `scripts/mcp/test-chrome-mcp.sh` (tests)
  - `scripts/mcp/capture-cdp.cjs`, `scripts/mcp/capture-cdp.sh` (capture tools)
  - `mcp:start`, `mcp:stop`, `mcp:wait` npm scripts for managed flows

- Optional/remove: helper/read-only scripts you do not use daily (review before deleting):
  - `scripts/mcp/read-console-logs.sh`, `scripts/mcp/simple-console-reader.sh`, `scripts/mcp/capture-console.js`, `scripts/mcp/capture-network-debug.js` — keep if they are useful for ad-hoc tasks; otherwise you may archive them.


PID & logs
- MCP PID: `scripts/mcp/mcp.pid` (created by `mcp:start`).
- MCP log: `scripts/mcp/mcp.log`.
- Chrome PID: `~/.local/share/songshare-effect/chrome.pid` (created by `start-chrome-debug*.sh`).
 - Chrome log: `~/.local/share/songshare-effect/chrome.log` (stdout/stderr from the Chrome process started by the scripts).

Environment variables
- DEV_SERVER_PORT — default 5173 used to find the app URL in scripts.
- DEV_SERVER_URL — override full dev URL (e.g., `http://localhost:5173`).
- CHROME_DEBUG_PORT — default 9222.


Examples (recommended)
- Start MCP (backgrounded) and wait for it to be ready:
```bash
npm run mcp:start
npm run mcp:wait
```

- Start secure Chrome and open the app (dev server should already be running):
```bash
npm run chrome:debug:secure
```

- Run console injection test:
```bash
npm run chrome:test:console
```

- Stream Console+Network for 30s:
```bash
npm run debug:cdp-capture -- 30000
```

Quick managed dev (simple):
```bash
# start MCP, wait, then run the dev servers (safer than concurrently when order matters)
npm run mcp:start && npm run mcp:wait && npm run dev
```

If you want, I can also:
- Add a short `scripts/README.md` in the `scripts/` folder that includes a one-line summary for each script (I can do that next).
- Remove/archivize optional helper scripts you don't want to keep. Provide a list and I'll remove them.
