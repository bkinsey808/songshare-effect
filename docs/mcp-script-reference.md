````markdown
# MCP Script Reference

This page documents all MCP (Chrome DevTools Model Context Protocol) related scripts in this repo and the npm scripts that wrap them. Use this as a quick reference when debugging with DevTools / MCP.

## Quickstart (minimal)

1. Start the MCP server (backgrounded) and wait until ready:

```bash
npm run mcp:start
npm run mcp:wait
```
````

2. Start secure Chrome (opens the app URL):

```bash
npm run chrome:debug:secure
```

3. Run console capture or tracing tests:

```bash
npm run chrome:test:console
npm run debug:cdp-capture -- 30000
```

4. Stop MCP and Chrome when done:

```bash
npm run mcp:stop        # accepts -- --kill-chrome when using npm to forward args
```

This quickstart is a compact copy of the longer guide. The full guide and reference are on this page.

## Guide / How-to

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

4. Clean up: kill debug processes and clear debug profiles when finished.

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

```

```
