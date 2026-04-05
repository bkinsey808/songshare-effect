#!/usr/bin/env bun
/* oxlint-disable jest/require-hook */
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

import { ONE, ZERO } from "@/shared/constants/shared-constants";

import { error as sError, warn as sWarn } from "../utils/scriptLogger";
import { stripAnsi } from "../utils/stripAnsi";
import browsersAlreadyInstalled from "./helpers/browsersAlreadyInstalled";
import findBrowserExecutable from "./helpers/findBrowserExecutable";
import libsMissingForExecutable from "./helpers/libsMissingForExecutable";
import maybePromptInstallDeps from "./helpers/maybePromptInstallDeps";
const START_SCRIPT = path.join("scripts", "playwright", "playwright-start-preview.bun.ts");
const READY_MARKER = "PLAYWRIGHT_WRAPPER: READY";

const localStack = spawn("bun", [START_SCRIPT], {
	stdio: ["ignore", "pipe", "pipe"],
	env: { ...process.env },
});

let ready = false;
let startedPlaywright = false;
let playwrightProcess: ReturnType<typeof spawn> | undefined = undefined;

const startTime = Date.now();
const DEFAULT_TIMEOUT = 120_000;
const ARGV_FILE_INDEX = 2;
const EXIT_NON_ZERO = 1;
const INTERVAL_MS = 500;

const TIMEOUT = Number(process.env["PLAYWRIGHT_DEV_TIMEOUT"] ?? DEFAULT_TIMEOUT);
const VERBOSE =
	typeof process.env["PLAYWRIGHT_VERBOSE"] === "string" &&
	process.env["PLAYWRIGHT_VERBOSE"] !== "";

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
	if (!ready || startedPlaywright) {
		return;
	}
	startedPlaywright = true;

	sWarn("Local preview/API stack ready — starting Playwright tests");

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
				if (!localStack.killed) {
					localStack.kill();
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

/**
 * Handles log output from the local preview wrapper.
 *
 * @param raw - Output chunk from the wrapper process.
 */
function handleOutput(raw: string): void {
	const line = stripAnsi(raw).trim();
	if (!VERBOSE && line.startsWith("[wrangler:info]")) {
		return;
	}
	process.stdout.write(raw);
	if (!ready && line.includes(READY_MARKER)) {
		ready = true;
		startPlaywrightIfReady();
	}
}

if (localStack.stdout !== undefined) {
	localStack.stdout.setEncoding("utf8");
	let buf = "";
	localStack.stdout.on("data", (chunk: string) => {
		buf += chunk;
		const lines = buf.split(/\r?\n/);
		buf = lines.pop() ?? "";
		for (const line of lines) {
			handleOutput(`${line}\n`);
		}
	});
}

if (localStack.stderr !== undefined) {
	localStack.stderr.setEncoding("utf8");
	let buf2 = "";
	localStack.stderr.on("data", (chunk: string) => {
		buf2 += chunk;
		const lines = buf2.split(/\r?\n/);
		buf2 = lines.pop() ?? "";
		for (const line of lines) {
			handleOutput(`${line}\n`);
		}
	});
}

localStack.on("exit", () => {
	sError("Local preview/API wrapper exited");
	if (!startedPlaywright) {
		sError("Local preview/API stack exited before Playwright started.");
		process.exit(EXIT_NON_ZERO);
	}
});

const interval = setInterval(() => {
	if (startedPlaywright) {
		clearInterval(interval);
		return;
	}
	if (Date.now() - startTime > TIMEOUT) {
		sError("Timed out waiting for the local preview/API stack to become ready (ms):", TIMEOUT);
		try {
			if (!localStack.killed) {
				localStack.kill();
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
		if (!localStack.killed) {
			localStack.kill();
		}
	} catch {
		// Ignore kill errors
	}
	process.exit(EXIT_NON_ZERO);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

sWarn("Playwright preview+api test wrapper started");
