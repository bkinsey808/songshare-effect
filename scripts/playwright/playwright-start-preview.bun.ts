#!/usr/bin/env bun
/* oxlint-disable jest/require-hook */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

import { error as sError, log as sLog, warn as sWarn } from "../utils/scriptLogger";
import { API_LOG, CLIENT_LOG, TAIL_LINES } from "./helpers/logPaths";
import probeUrl from "./helpers/probeUrl";
import whichExists from "./helpers/whichExists";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const FRONTEND_PORT = 5173;
const API_PORT = 8787;
const PORTS_TO_RESET = [String(FRONTEND_PORT), String(API_PORT)] as const;
const DEFAULT_PID = 0;
const NO_PROCESSES = 0;
const WAIT_SECONDS = Number(process.env["WAIT_SECONDS"] ?? "180");
const POLL_MS = 500;
const MS_PER_SECOND = 1000;
const SHARED_ARRAY_SIZE = 4;
const WAIT_INDEX = 0;
const WAIT_VALUE = 0;
const BUILD_SCRIPT = process.env["PLAYWRIGHT_BUILD_SCRIPT"] ?? "build:client:staging";
const API_SCRIPT = process.env["PLAYWRIGHT_API_SCRIPT"] ?? "dev:api:staging";

/**
 * Probes the preview server using conservative localhost and loopback URLs.
 *
 * @returns Whether the preview server is reachable.
 */
function probeFrontend(): boolean {
	return (
		probeUrl(`http://127.0.0.1:${FRONTEND_PORT}`) ||
		probeUrl(`https://127.0.0.1:${FRONTEND_PORT}`) ||
		probeUrl(`http://localhost:${FRONTEND_PORT}`) ||
		probeUrl(`https://localhost:${FRONTEND_PORT}`)
	);
}

/**
 * Probes the local API server.
 *
 * @returns Whether the API is reachable.
 */
function probeApi(): boolean {
	return probeUrl(`http://127.0.0.1:${API_PORT}`) || probeUrl(`http://localhost:${API_PORT}`);
}

/**
 * Resets a log file for the current run, ignoring filesystem errors.
 *
 * @param filePath - Log file to initialize.
 */
function ensureLogFile(filePath: string): void {
	try {
		fs.writeFileSync(filePath, "", { flag: "w" });
	} catch (error) {
		sWarn("could not create log file", filePath, error);
	}
}

/**
 * Runs the compiled frontend build before preview startup.
 *
 * @returns Whether the build completed successfully.
 */
function buildFrontend(): boolean {
	sLog(`Building compiled frontend for Playwright (npm run ${BUILD_SCRIPT})...`);
	const buildOutputFd = fs.openSync(CLIENT_LOG, "a");
	const result = spawnSync("npm", ["run", BUILD_SCRIPT], {
		shell: true,
		stdio: ["ignore", buildOutputFd, buildOutputFd],
	});
	fs.closeSync(buildOutputFd);
	return result.status === EXIT_SUCCESS;
}

/**
 * Clears any stale local listeners so Playwright always starts a fresh preview
 * server and API server for the test run.
 */
function resetPorts(): void {
	sLog(`Resetting local Playwright ports: ${PORTS_TO_RESET.join(", ")}`);
	const result = spawnSync("npx", ["kill-port", ...PORTS_TO_RESET], {
		shell: true,
		stdio: "inherit",
		env: { ...process.env },
	});
	if (result.status !== EXIT_SUCCESS) {
		sWarn("kill-port returned a non-zero status; continuing with startup");
	}
}

ensureLogFile(CLIENT_LOG);
ensureLogFile(API_LOG);

resetPorts();

if (!buildFrontend()) {
	sError(`Compiled frontend build failed (npm run ${BUILD_SCRIPT}).`);
	try {
		spawn("tail", ["-n", String(TAIL_LINES), CLIENT_LOG], {
			stdio: "inherit",
			shell: true,
		});
	} catch {
		// Ignore diagnostics failures.
	}
	process.exit(EXIT_FAILURE);
}

sLog(`Starting preview server (npm run preview -- --host 127.0.0.1 --port ${FRONTEND_PORT})...`);
const frontend = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "5173"], {
	stdio: ["ignore", fs.openSync(CLIENT_LOG, "a"), fs.openSync(CLIENT_LOG, "a")],
	shell: true,
});
const frontPid = typeof frontend.pid === "number" ? frontend.pid : DEFAULT_PID;

sLog(`Starting API (npm run ${API_SCRIPT})...`);
const apiProc = spawn("npm", ["run", API_SCRIPT], {
	stdio: ["ignore", fs.openSync(API_LOG, "a"), fs.openSync(API_LOG, "a")],
	shell: true,
});
const apiPid = typeof apiProc.pid === "number" ? apiProc.pid : DEFAULT_PID;

const pidsToWait = [frontPid, apiPid].filter((pid) => pid !== DEFAULT_PID);

if (pidsToWait.length === NO_PROCESSES) {
	sLog("PLAYWRIGHT_WRAPPER: READY");
	const tail = spawn("tail", ["-n", "+1", "-f", CLIENT_LOG, API_LOG], {
		stdio: "inherit",
		shell: true,
	});
	tail.on("exit", (code) => process.exit(code ?? EXIT_SUCCESS));
}

const startTime = Date.now();
let ready = false;
while ((Date.now() - startTime) / MS_PER_SECOND < WAIT_SECONDS) {
	if (probeFrontend() && probeApi()) {
		ready = true;
		break;
	}
	Atomics.wait(
		new Int32Array(new SharedArrayBuffer(SHARED_ARRAY_SIZE)),
		WAIT_INDEX,
		WAIT_VALUE,
		POLL_MS,
	);
}

if (!ready) {
	sError(
		`Preview/API stack did not become ready within ${WAIT_SECONDS}s. Collecting diagnostics...`,
	);
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
		sError("--- CLIENT LOG (last lines) ---");
		spawn("tail", ["-n", String(TAIL_LINES), CLIENT_LOG], {
			stdio: "inherit",
			shell: true,
		});
	} catch {
		// Ignore diagnostics failures.
	}
	try {
		sError("--- API LOG (last lines) ---");
		spawn("tail", ["-n", String(TAIL_LINES), API_LOG], {
			stdio: "inherit",
			shell: true,
		});
	} catch {
		// Ignore diagnostics failures.
	}
	for (const pid of pidsToWait) {
		try {
			process.kill(pid);
		} catch {
			// Ignore cleanup failures.
		}
	}
	process.exit(EXIT_FAILURE);
}

sLog("PLAYWRIGHT_WRAPPER: READY");

for (const pid of pidsToWait) {
	const watcher = spawn(
		"sh",
		["-c", `while kill -0 ${pid} 2>/dev/null; do sleep 1; done; echo EXITED_${pid}`],
		{ stdio: ["ignore", "pipe", "inherit"] },
	);
	watcher.stdout?.on("data", (chunk) => {
		const text = String(chunk).trim();
		if (text.startsWith("EXITED_")) {
			sError(
				`One of the preview/API processes exited (marker: ${text}). Tailing logs for debugging...`,
			);
			spawn("tail", ["-n", "+1", CLIENT_LOG], {
				stdio: "inherit",
				shell: true,
			});
			spawn("tail", ["-n", "+1", API_LOG], {
				stdio: "inherit",
				shell: true,
			});
			process.exit(EXIT_FAILURE);
		}
	});
}

const tail = spawn("tail", ["-n", "+1", "-f", CLIENT_LOG, API_LOG], {
	stdio: "inherit",
	shell: true,
});

/**
 * Stops child processes when Playwright shuts this wrapper down.
 */
function shutdown(): void {
	try {
		tail.kill();
	} catch {
		// Ignore cleanup failures.
	}
	for (const pid of pidsToWait) {
		try {
			process.kill(pid);
		} catch {
			// Ignore cleanup failures.
		}
	}
	process.exit(EXIT_FAILURE);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
