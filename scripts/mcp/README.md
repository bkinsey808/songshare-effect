
# MCP scripts

This folder contains MCP (Chrome DevTools MCP / CDP) utilities used to:

- launch Chrome with a remote debugging port for local development;
- run a local MCP server (`chrome-devtools-mcp`) to bridge clients to Chrome;
- capture Console and Network events for debugging, demoing, and CI checks.

These tools are for trusted development environments only. Do not run them on
production hosts or expose the debug port to untrusted networks.

File reference
--------------

Below is a short description and usage notes for every file currently present
in this directory. If you add/remove scripts, please keep this README in sync.

- `MCP_BROWSER_EXAMPLES.js`
	- Purpose: Browser-side example snippets (auth inspection, state checks,
		network hooks, performance checks). Intended to be copy/pasted into the
		DevTools console or injected via an MCP client.

- `README.md`
	- Purpose: This file (you are reading it).

- `capture-cdp.cjs`
	- Purpose: Node.js CDP capture harness. Connects to a CDP websocket and
		streams Console + Network events for a configured duration.
	- Usage: `node scripts/mcp/capture-cdp.cjs <webSocketDebuggerUrl> [durationMs]`

- `capture-cdp.sh`
	- Purpose: Shell wrapper that finds the app tab's `webSocketDebuggerUrl`
		(searches for `DEV_SERVER_URL`) and invokes `capture-cdp.cjs`.
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


Notes & best practices
----------------------

- These scripts are development-only helpers. Never run them on production or
	on networks you don't control.
- Prefer `start-chrome-debug-secure.sh` for multi-user machines. It binds the
	debug server to localhost and avoids the more dangerous flags.
- `mcp.log` is intentionally a runtime file — do not commit it. If you find
	it tracked in Git, remove it from the index and add `scripts/mcp/mcp.log` to
	`.gitignore`.

If you want, I can also:

- convert these helpers into a small Node CLI for consistency;
- add a short usage README alongside each script with examples;
- prepare a single `npm run mcp:all` orchestration that starts MCP and Chrome
	with sensible defaults.
