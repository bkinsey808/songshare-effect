/* eslint-disable sonarjs/no-os-command-from-path */
import { spawn } from "child_process";
import path from "path";

// Cross-platform timeout wrapper for running bun Playwright test script.
// Usage: PLAYWRIGHT_BASE_URL=https://localhost:5173 bun ./scripts/run-playwright-with-timeout.bun.ts [bun args]

const rawTimeout =
	process.env["PLAYWRIGHT_RUN_TIMEOUT"] ?? process.env["RUN_TIMEOUT"];
const timeoutSeconds = Number(
	rawTimeout !== undefined && rawTimeout.length > 0 ? rawTimeout : "180",
);
const cwd = process.cwd();

const bunScriptPath = path.join("scripts", "playwright-run-and-test.bun.ts");
const bunArgs = [bunScriptPath, ...process.argv.slice(2)];

// Ensure PLAYWRIGHT_BASE_URL has a sensible default for convenience
if (!(process.env["PLAYWRIGHT_BASE_URL"] ?? "").length) {
	process.env["PLAYWRIGHT_BASE_URL"] = "https://localhost:5173";
}

console.warn(`Starting Playwright tests with a ${timeoutSeconds}s timeout`);
console.warn(`Running: bun ${bunArgs.join(" ")}`);

const child = spawn("bun", bunArgs, {
	stdio: "inherit",
	env: { ...process.env },
	cwd,
});

let killed = false;
const killTimer = setTimeout(() => {
	killed = true;
	console.error(`Timeout reached (${timeoutSeconds}s) — terminating test run`);
	// Send SIGTERM to give tests a chance to clean up
	child.kill("SIGTERM");
	// If still alive after 5s, force kill
	setTimeout(() => child.kill("SIGKILL"), 5000);
}, timeoutSeconds * 1000);

child.on("exit", (code, signal) => {
	clearTimeout(killTimer);
	if (killed && signal) {
		console.error(`Test run killed after timeout (signal: ${signal}).`);
		// common UNIX code for timeout
		process.exit(124);
	}
	process.exit(code ?? 0);
});

child.on("error", (err) => {
	clearTimeout(killTimer);
	console.error("Failed to start Playwright runner:", err);
	process.exit(1);
});
