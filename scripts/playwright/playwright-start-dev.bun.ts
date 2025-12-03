#!/usr/bin/env bun
/* eslint-disable jest/require-hook */
/*
  Non-interactive Playwright start wrapper (Bun/TypeScript)
  Starts frontend dev and API dev servers (wrangler), waits until both are ready, prints READY, and tails logs.

  This script is suitable for CI where we need deterministic non-interactive behaviour.
*/
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { warn as sWarn, error as sError, log as sLog } from "../utils/scriptLogger";
import isPortListening from "./helpers/isPortListening";
import { CLIENT_LOG, API_LOG, TAIL_LINES } from "./helpers/logPaths";
import probeUrl from "./helpers/probeUrl";
import whichExists from "./helpers/whichExists";

// Primary constants
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const FRONTEND_PORT = 5173;
const API_PORT = 8787;
// Sentinel values and small helpers
const DEFAULT_PID = 0;
const EMPTY_COUNT = 0;
const WAIT_INDEX = 0;
const WAIT_VALUE = 0;
const WAIT_SECONDS = Number(process.env["WAIT_SECONDS"] ?? "60");
const POLL_MS = 500;
// TAIL_LINES provided by helpers
const MS_PER_SECOND = 1000;
const SHARED_ARRAY_SIZE = 4;

// LOG_DIR/CLIENT_LOG/API_LOG provided by shared helpers

// Constants & helpers
// Constants defined above

// Helper functions

function probeFrontend(): boolean {
	return (
		probeUrl(`https://127.0.0.1:${FRONTEND_PORT}`) ||
		probeUrl(`http://127.0.0.1:${FRONTEND_PORT}`) ||
		probeUrl(`https://localhost:${FRONTEND_PORT}`) ||
		probeUrl(`http://localhost:${FRONTEND_PORT}`)
	);
}

function probeApi(): boolean {
	return probeUrl(`http://127.0.0.1:${API_PORT}`) || probeUrl(`http://localhost:${API_PORT}`);
}

// probeUrl, spawnSyncShell, spawnSyncInternal, whichExists, isPortListening and log paths
// are delegated to the shared helpers module

function clientLogHasViteLocal(port: number): boolean {
	try {
		if (!fs.existsSync(CLIENT_LOG)) {
			return false;
		}
		const contents = fs.readFileSync(CLIENT_LOG, "utf8");
		return new RegExp(`Local:.*${port}`).test(contents);
	} catch {
		return false;
	}
}

// Ensure log files exist
try {
	fs.writeFileSync(CLIENT_LOG, "", { flag: "a" });
} catch (error) {
	sWarn("could not create client log", error);
}
try {
	fs.writeFileSync(API_LOG, "", { flag: "a" });
} catch (error) {
	sWarn("could not create api log", error);
}

// If both endpoints are already ready, just tail logs
if (probeFrontend() && probeApi()) {
	sWarn(
		`Detected existing dev servers on ${FRONTEND_PORT} and ${API_PORT}; reusing them. Marking ready and tailing logs.`,
	);
	sLog("PLAYWRIGHT_WRAPPER: READY");
	// Use a blocking tail to mirror earlier behavior
	const tail = spawn("tail", ["-n", "+1", "-f", CLIENT_LOG, API_LOG], {
		stdio: "inherit",
		shell: true,
	});
	tail.on("exit", (code) => process.exit(code ?? EXIT_SUCCESS));
}

// Start frontend if not listening
let frontPid = DEFAULT_PID;
if (probeFrontend()) {
	sWarn(`Frontend already listening on ${FRONTEND_PORT}; will not start a new vite instance`);
} else {
	sLog(`Starting frontend (npm run dev:client) -> logs: ${CLIENT_LOG}`);
	const frontend = spawn("npm", ["run", "dev:client"], {
		stdio: ["ignore", fs.openSync(CLIENT_LOG, "a"), fs.openSync(CLIENT_LOG, "a")],
		shell: true,
	});
	frontPid = typeof frontend.pid === "number" ? frontend.pid : DEFAULT_PID;
}

// Start API if not already running
let apiPid = DEFAULT_PID;
if (probeApi()) {
	sWarn(`API already listening on ${API_PORT}; will not start a new wrangler instance`);
} else {
	sLog(`Starting API (wrangler dev) -> logs: ${API_LOG}`);
	// Start wrangler dev in api/ cwd
	const apiProc = spawn(
		`env CLOUDFLARE_API_TOKEN="${process.env["CLOUDFLARE_API_TOKEN"] ?? ""}" npx wrangler dev --no-enable-containers --env dev`,
		{
			cwd: path.join(process.cwd(), "api"),
			stdio: ["ignore", fs.openSync(API_LOG, "a"), fs.openSync(API_LOG, "a")],
			shell: true,
		},
	);
	apiPid = typeof apiProc.pid === "number" ? apiProc.pid : DEFAULT_PID;
}

// Prepare PIDs to wait on
const pidsToWait: number[] = [];
if (frontPid !== DEFAULT_PID) {
	pidsToWait.push(frontPid);
}
if (apiPid !== DEFAULT_PID) {
	pidsToWait.push(apiPid);
}

// If neither process started (we reused existing servers) then tail logs until killed
if (pidsToWait.length === EMPTY_COUNT) {
	sLog("PLAYWRIGHT_WRAPPER: READY");
	const tail = spawn("tail", ["-n", "+1", "-f", CLIENT_LOG, API_LOG], {
		stdio: "inherit",
		shell: true,
	});
	tail.on("exit", (code) => process.exit(code ?? EXIT_SUCCESS));
}

// Wait for readiness: first check client log for 'Local:.*5173' or probe endpoints
const startTime = Date.now();
let ready = false;
while ((Date.now() - startTime) / MS_PER_SECOND < WAIT_SECONDS) {
	// check client log for Vite local marker
	// Check the client log for vite 'Local:' line (the helper handles errors)
	if (clientLogHasViteLocal(FRONTEND_PORT)) {
		if (isPortListening(FRONTEND_PORT)) {
			ready = true;
			break;
		}
		sWarn(
			`Detected Vite Local log line but port ${FRONTEND_PORT} not listening yet; continuing to wait...`,
		);
	}

	if (probeFrontend()) {
		ready = true;
		break;
	}
	// small sleep
	Atomics.wait(
		new Int32Array(new SharedArrayBuffer(SHARED_ARRAY_SIZE)),
		WAIT_INDEX,
		WAIT_VALUE,
		POLL_MS,
	);
}

if (!ready) {
	sError(`Frontend did not become ready within ${WAIT_SECONDS}s. Collecting diagnostics...`);
	try {
		if (whichExists("ss")) {
			spawn("ss", ["-ltnp"], { stdio: "inherit", shell: true });
		} else if (whichExists("netstat")) {
			spawn("netstat", ["-ltnp"], { stdio: "inherit", shell: true });
		}
	} catch (error) {
		sWarn("failed to list ports", error);
	}
	try {
		sError("--- CLIENT LOG (last 200 lines) ---");
		spawn("tail", ["-n", String(TAIL_LINES), CLIENT_LOG], { stdio: "inherit", shell: true });
	} catch (error) {
		sWarn("failed tail client", error);
	}
	try {
		sError("--- API LOG (last 200 lines) ---");
		spawn("tail", ["-n", String(TAIL_LINES), API_LOG], { stdio: "inherit", shell: true });
	} catch (error) {
		sWarn("failed tail api", error);
	}
	// kill any started processes
	for (const pid of pidsToWait) {
		try {
			process.kill(pid);
		} catch {
			/* ignore */
		}
	}
	process.exit(EXIT_FAILURE);
}

// Ready
sLog("PLAYWRIGHT_WRAPPER: READY");

// Wait on started PIDs. If any process exits, tail logs for debugging.
for (const pid of pidsToWait) {
	// spawn a watcher for each pid
	const watcher = spawn(
		"sh",
		["-c", `while kill -0 ${pid} 2>/dev/null; do sleep 1; done; echo EXITED_${pid}`],
		{ stdio: ["ignore", "pipe", "inherit"], shell: true },
	);
	watcher.stdout?.on("data", (chunk) => {
		const txt = String(chunk).trim();
		if (txt.startsWith("EXITED_")) {
			sError(`One of the dev processes exited (marker: ${txt}). Tailing logs for debugging...`);
			spawn("tail", ["-n", "+1", CLIENT_LOG], { stdio: "inherit", shell: true });
			spawn("tail", ["-n", "+1", API_LOG], { stdio: "inherit", shell: true });
			process.exit(EXIT_FAILURE);
		}
	});
}

// Keep the main process alive by tailing logs, Playwright will kill this wrapper when tests finish
const tail = spawn("tail", ["-n", "+1", "-f", CLIENT_LOG, API_LOG], {
	stdio: "inherit",
	shell: true,
});

function shutdown(): void {
	try {
		tail.kill();
	} catch {
		/* ignore */
	}
	for (const pid of pidsToWait) {
		try {
			process.kill(pid);
		} catch {
			/* ignore */
		}
	}
	process.exit(EXIT_FAILURE);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
