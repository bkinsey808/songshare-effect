#!/usr/bin/env bun
/* eslint-disable jest/require-hook */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { warn as sWarn, error as sError } from "./utils/scriptLogger";
import { stripAnsi } from "./utils/stripAnsi";

const LOG_DIR =
	typeof process.env["LOG_DIR"] === "string" && process.env["LOG_DIR"] !== ""
		? process.env["LOG_DIR"]
		: "/tmp";
const CLIENT_LOG = path.join(LOG_DIR, "playwright-dev-client.log");
const API_LOG = path.join(LOG_DIR, "playwright-dev-api.log");

// Truncate/create logs
try {
	fs.writeFileSync(CLIENT_LOG, "", { flag: "w" });
	fs.writeFileSync(API_LOG, "", { flag: "w" });
} catch {
	// Ignore log file creation errors
}

const dev = spawn("npm", ["run", "dev"], { shell: true });
const clientStream = fs.createWriteStream(CLIENT_LOG, { flags: "a" });
const apiStream = fs.createWriteStream(API_LOG, { flags: "a" });

let frontendReady = false;
let apiReady = false;
let startedPlaywright = false;
let playwrightProcess: ReturnType<typeof spawn> | undefined = undefined;

const startTime = Date.now();
const DEFAULT_TIMEOUT = 120_000;
const ZERO = 0;
const ONE = 1;
const ARGV_FILE_INDEX = 2;
const EXIT_NON_ZERO = 1;
const INTERVAL_MS = 500;

const TIMEOUT = Number(process.env["PLAYWRIGHT_DEV_TIMEOUT"] ?? DEFAULT_TIMEOUT);

// ANSI stripping is handled by `scripts/utils/stripAnsi.ts`

function startPlaywrightIfReady(): void {
	if (!frontendReady || !apiReady || startedPlaywright) {
		return;
	}
	startedPlaywright = true;

	// Dev servers ready — starting Playwright tests
	sWarn("Dev servers ready — starting Playwright tests");

	// Ensure Playwright browsers are installed before running tests. If you
	// want to skip automatic installation (for CI or offline environments),
	// set PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 in the environment.
	async function installBrowsers(): Promise<void> {
		const skipInstall =
			typeof process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] === "string" &&
			process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] !== "";
		if (skipInstall) {
			sWarn("Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1");
			return;
		}
		try {
			sWarn(
				"Ensuring Playwright browsers are installed. This may take a minute (or longer the first time)...",
			);
			// `npx playwright install` is idempotent and will no-op if already installed.
			// eslint-disable-next-line promise/avoid-new
			await new Promise<void>((resolve, reject) => {
				// Avoid installing OS packages when running in CI (GitHub Actions
				// or other CI environments) — not all distributions are supported
				// by Playwright's install-deps path and it caused apt failures on
				// Ubuntu 'noble'. Only install browsers in CI.
				const isCI =
					(typeof process.env["CI"] === "string" && process.env["CI"] !== "") ||
					(typeof process.env["GITHUB_ACTIONS"] === "string" &&
						process.env["GITHUB_ACTIONS"] !== "");
				const args = isCI ? ["playwright", "install"] : ["playwright", "install", "--with-deps"];
				const installer = spawn("npx", args, {
					shell: true,
					stdio: "inherit",
					env: { ...process.env },
				});
				installer.on("exit", (code) => {
					if (code === ZERO) {
						resolve();
						return;
					}
					reject(new Error(`playwright install failed with code ${code}`));
				});
				installer.on("error", (err) => {
					reject(err);
				});
			});
		} catch (error) {
			sError("Playwright browser install failed:", error);
			sError(
				"Run `npx playwright install` manually to download browsers or set PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 to opt out.",
			);
			process.exit(EXIT_NON_ZERO);
		}
	}

	const args = ["playwright", "test", ...process.argv.slice(ARGV_FILE_INDEX)];
	void (async (): Promise<void> => {
		await installBrowsers();
		const proc = spawn("npx", args, {
			shell: true,
			stdio: "inherit",
		});
		playwrightProcess = proc;
		// Playwright process exit handler — ensure we kill dev servers and
		// then exit with the same exit code.
		proc.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
			try {
				if (!dev.killed) {
					dev.kill();
				}
			} catch {
				// Ignore kill errors
			}
			let exitCode = 0;
			if (code === null) {
				exitCode = signal ? ONE : ZERO;
			} else {
				exitCode = code;
			}
			const finalCode = exitCode ?? ZERO;
			process.exit(finalCode);
		});
	})();
}

function handleLine(raw: string): void {
	clientStream.write(`${raw}\n`);
	apiStream.write(`${raw}\n`);
	const line = stripAnsi(raw).trim();

	if (
		!frontendReady &&
		/(Local:.*5173|https?:\/\/127\.0\.0\.1:5173|https?:\/\/localhost:5173)/.test(line)
	) {
		frontendReady = true;

		// Detected frontend ready -> output
		sWarn("Detected frontend ready ->", line);
	}

	if (!apiReady && /Ready on .*:8787/.test(line)) {
		apiReady = true;

		// Detected API ready -> output
		sWarn("Detected API ready ->", line);
	}

	startPlaywrightIfReady();
}

if (dev.stdout !== undefined) {
	dev.stdout.setEncoding("utf8");
	let buf = "";
	dev.stdout.on("data", (chunk: string) => {
		buf += chunk;
		const lines = buf.split(/\r?\n/);
		buf = lines.pop() ?? "";
		for (const line of lines) {
			handleLine(line);
		}
	});
}

if (dev.stderr !== undefined) {
	dev.stderr.setEncoding("utf8");
	let buf2 = "";
	dev.stderr.on("data", (chunk: string) => {
		buf2 += chunk;
		const lines = buf2.split(/\r?\n/);
		buf2 = lines.pop() ?? "";
		for (const line of lines) {
			handleLine(line);
		}
	});
}

dev.on("exit", () => {
	sError("Dev process exited");
	if (!startedPlaywright) {
		sError("Dev servers exited before Playwright started. Check logs:", CLIENT_LOG, API_LOG);
		process.exit(EXIT_NON_ZERO);
	}
});

const interval = setInterval(() => {
	if (startedPlaywright) {
		clearInterval(interval);
		return;
	}
	if (Date.now() - startTime > TIMEOUT) {
		sError("Timed out waiting for dev servers to become ready (ms):", TIMEOUT);
		sError("Last output written to:", CLIENT_LOG, API_LOG);
		try {
			if (!dev.killed) {
				dev.kill();
			}
		} catch {
			// Ignore kill errors
		}
		process.exit(EXIT_NON_ZERO);
	}
}, INTERVAL_MS);

function shutdown(): void {
	try {
		if (playwrightProcess && !playwrightProcess.killed) {
			playwrightProcess.kill();
		}
	} catch {
		// Ignore kill errors
	}
	try {
		if (!dev.killed) {
			dev.kill();
		}
	} catch {
		// Ignore kill errors
	}
	process.exit(EXIT_NON_ZERO);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Playwright dev+test: logs -> output
sWarn(`Playwright dev+test: logs -> ${CLIENT_LOG}, ${API_LOG}`);
