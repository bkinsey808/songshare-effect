#!/usr/bin/env bun
/* eslint-disable jest/require-hook */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ONE, ZERO } from "@/shared/constants/shared-constants";

import { error as sError, warn as sWarn } from "../utils/scriptLogger";
import { stripAnsi } from "../utils/stripAnsi";
import browsersAlreadyInstalled from "./helpers/browsersAlreadyInstalled";
import findBrowserExecutable from "./helpers/findBrowserExecutable";
import libsMissingForExecutable from "./helpers/libsMissingForExecutable";
import { API_LOG, CLIENT_LOG } from "./helpers/logPaths";
import maybePromptInstallDeps from "./helpers/maybePromptInstallDeps";

// LOG_DIR, CLIENT_LOG, API_LOG are provided by shared helpers

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
const ARGV_FILE_INDEX = 2;
const EXIT_NON_ZERO = 1;
const INTERVAL_MS = 500;

const TIMEOUT = Number(process.env["PLAYWRIGHT_DEV_TIMEOUT"] ?? DEFAULT_TIMEOUT);

// Module-scope helpers for Playwright browser detection and system lib checks
// browser detection helpers and LOG constants are imported from ./helpers

async function installBrowsers(): Promise<void> {
	const skipInstall =
		typeof process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] === "string" &&
		process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] !== "";
	if (skipInstall) {
		sWarn("Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1");
		return;
	}

	// Avoid running installer when browsers already exist.
	if (browsersAlreadyInstalled()) {
		sWarn("Playwright browsers already present in cache — skipping installer.");
		return;
	}
	try {
		sWarn(
			"Ensuring Playwright browsers are installed. This may take a minute (or longer the first time)...",
		);
		// `npx playwright install` is idempotent and will no-op if already installed.
		// Use spawnSync to avoid creating a new Promise (keep the script simple and synchronous here).
		const isCI =
			(typeof process.env["CI"] === "string" && process.env["CI"] !== "") ||
			(typeof process.env["GITHUB_ACTIONS"] === "string" && process.env["GITHUB_ACTIONS"] !== "");
		// Run the installer synchronously so we can proceed only when it completes.
		const installArgs = ["playwright", "install"];
		const installerResult = spawnSync("npx", installArgs, {
			shell: true,
			stdio: "inherit",
			env: { ...process.env },
		});
		if (installerResult.status !== ZERO) {
			throw new Error(`playwright install failed with code ${String(installerResult.status)}`);
		}

		// After the installer finishes, check whether system libs are missing
		// and prompt the user (interactive) to install them.
		const repoPathCandidate: string | undefined =
			typeof process.env["PLAYWRIGHT_BROWSERS_PATH"] === "string" &&
			process.env["PLAYWRIGHT_BROWSERS_PATH"] !== ""
				? process.env["PLAYWRIGHT_BROWSERS_PATH"]
				: undefined;
		const xdgAfter = process.env["XDG_CACHE_HOME"] ?? path.join(os.homedir(), ".cache");
		const candidatesAfter: string[] = [path.join(xdgAfter, "ms-playwright")];
		if (repoPathCandidate !== undefined && repoPathCandidate !== "") {
			candidatesAfter.unshift(repoPathCandidate);
		}

		let exe: string | undefined = undefined;
		for (const cacheCandidate of candidatesAfter) {
			exe = findBrowserExecutable(cacheCandidate);
			if (exe !== undefined && exe !== "") {
				break;
			}
		}

		if (exe !== undefined && libsMissingForExecutable(exe)) {
			sWarn("Playwright has missing system libraries required to run browsers (detected via ldd).");
			await maybePromptInstallDeps(isCI, exe);
		}
	} catch (error) {
		sError("Playwright browser install failed:", error);
		sError(
			"Run `npx playwright install` manually to download browsers or set PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 to opt out.",
		);
		process.exit(EXIT_NON_ZERO);
	}
}

function startPlaywrightIfReady(): void {
	if (!frontendReady || !apiReady || startedPlaywright) {
		return;
	}
	startedPlaywright = true;

	// Dev servers ready — starting Playwright tests
	sWarn("Dev servers ready — starting Playwright tests");

	const args = ["playwright", "test", ...process.argv.slice(ARGV_FILE_INDEX)];

	// Start the Playwright process after ensuring browsers are installed
	void (async (): Promise<void> => {
		await installBrowsers();
		const proc = spawn("npx", args, {
			shell: true,
			stdio: "inherit",
		});
		playwrightProcess = proc;

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
