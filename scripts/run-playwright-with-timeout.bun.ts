/* oxlint-disable sonarjs/no-os-command-from-path */
import { spawn } from "child_process";
import path from "path";

import { warn as sWarn, error as sError } from "./utils/scriptLogger";

// Cross-platform timeout wrapper for running bun Playwright test script.
// Usage: PLAYWRIGHT_BASE_URL=https://localhost:5173 bun ./scripts/run-playwright-with-timeout.bun.ts [bun args]

const DEFAULT_TIMEOUT_SECONDS = 180;
const ARGV_FILE_INDEX = 2;
const KILL_GRACE_MS = 5000;
const MS_PER_SECOND = 1000;
const EXIT_TIMEOUT_CODE = 124;
const EXIT_FAILURE = 1;
const ZERO = 0;

const rawTimeout =
	process.env["PLAYWRIGHT_RUN_TIMEOUT"] ?? process.env["RUN_TIMEOUT"];
const timeoutSeconds = Number(
	rawTimeout !== undefined && rawTimeout.length > ZERO
		? rawTimeout
		: String(DEFAULT_TIMEOUT_SECONDS),
);
const cwd = process.cwd();

const bunScriptPath = path.join("scripts", "playwright-run-and-test.bun.ts");
const bunArgs = [bunScriptPath, ...process.argv.slice(ARGV_FILE_INDEX)];

// Ensure PLAYWRIGHT_BASE_URL has a sensible default for convenience
if (!(process.env["PLAYWRIGHT_BASE_URL"] ?? "").length) {
	process.env["PLAYWRIGHT_BASE_URL"] = "https://localhost:5173";
}

sWarn(`Starting Playwright tests with a ${timeoutSeconds}s timeout`);
sWarn(`Running: bun ${bunArgs.join(" ")}`);

const child = spawn("bun", bunArgs, {
	stdio: "inherit",
	env: { ...process.env },
	cwd,
});

let killed = false;
const killTimer = setTimeout(() => {
	killed = true;
	sError(`Timeout reached (${timeoutSeconds}s) — terminating test run`);
	// Send SIGTERM to give tests a chance to clean up
	child.kill("SIGTERM");
	// If still alive after KILL_GRACE_MS, force kill
	setTimeout(() => child.kill("SIGKILL"), KILL_GRACE_MS);
}, timeoutSeconds * MS_PER_SECOND);

child.on("exit", (code, signal) => {
	clearTimeout(killTimer);
	if (killed && signal) {
		sError(`Test run killed after timeout (signal: ${signal}).`);
		// common UNIX code for timeout
		process.exit(EXIT_TIMEOUT_CODE);
	}
	process.exit(code ?? ZERO);
});

child.on("error", (err) => {
	clearTimeout(killTimer);
	sError("Failed to start Playwright runner:", err);
	process.exit(EXIT_FAILURE);
});
