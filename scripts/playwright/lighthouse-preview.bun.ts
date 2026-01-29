#!/usr/bin/env bun
/**
 * Runs Lighthouse tests against a production build preview server.
 * 1. Builds the client
 * 2. Starts preview server on port 4173
 * 3. Runs Lighthouse spec
 * 4. Cleans up
 */
import { spawn, spawnSync, type SpawnSyncOptions } from "node:child_process";
import fs from "node:fs";

import { error as sError, log as sLog, warn as sWarn } from "../utils/scriptLogger";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const WAIT_TIMEOUT_MS = 60_000;
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `https://127.0.0.1:${PREVIEW_PORT}`;

function run(cmd: string, args: string[], opts: { ignoreOutput?: boolean } = {}): number {
	const options: SpawnSyncOptions = {
		stdio: opts.ignoreOutput === true ? "ignore" : "inherit",
		shell: true,
		env: { ...process.env },
	};
	const res = spawnSync(cmd, args, options);
	return typeof res.status === "number" ? res.status : EXIT_FAILURE;
}

function background(cmd: string): number | undefined {
	const proc = spawn(cmd, { shell: true, stdio: "ignore", detached: true });
	proc.unref();
	return typeof proc.pid === "number" ? proc.pid : undefined;
}

function waitForUrl(url: string, timeoutMs: number): boolean {
	const code = run("npx", ["wait-on", "-t", String(timeoutMs), url], {
		ignoreOutput: true,
	});
	return code === EXIT_SUCCESS;
}

function cleanup(): void {
	try {
		if (fs.existsSync("lighthouse-preview.pid")) {
			const pidStr = fs.readFileSync("lighthouse-preview.pid", "utf8").trim();
			if (pidStr) {
				run("kill", [pidStr], { ignoreOutput: true });
			}
			fs.rmSync("lighthouse-preview.pid", { force: true });
		}
	} catch {
		// ignore cleanup errors
	}
	fs.rmSync("lighthouse-preview.log", { force: true });
}

function main(): void {
	// Clean up any leftover processes from previous runs
	cleanup();

	sLog("Building client for production...");
	if (run("npm", ["run", "build:client"]) !== EXIT_SUCCESS) {
		sError("Failed to build client");
		process.exit(EXIT_FAILURE);
	}

	sLog(`Starting Vite preview server on port ${PREVIEW_PORT}...`);
	const startCmd = `nohup npm run preview -- --host 127.0.0.1 --port ${PREVIEW_PORT} > lighthouse-preview.log 2>&1 & echo $!`;
	const pid = background(startCmd);
	if (pid !== undefined) {
		try {
			fs.writeFileSync("lighthouse-preview.pid", String(pid));
		} catch {
			sWarn("Could not write lighthouse-preview.pid (continuing)");
		}
	}

	sLog(`Waiting for preview server at ${PREVIEW_URL} (timeout 60s)...`);
	// Try HTTPS first (Vite preview uses HTTPS by default with certs)
	let reachable = waitForUrl(PREVIEW_URL, WAIT_TIMEOUT_MS);
	if (!reachable) {
		// Fall back to HTTP
		reachable = waitForUrl(`http://127.0.0.1:${PREVIEW_PORT}`, WAIT_TIMEOUT_MS);
	}

	if (!reachable) {
		sError("Preview server did not start. Log output:");
		try {
			const contents = fs.readFileSync("lighthouse-preview.log", { encoding: "utf8" });
			sError(contents);
		} catch {
			sError("(could not read lighthouse-preview.log)");
		}
		cleanup();
		process.exit(EXIT_FAILURE);
	}

	sLog("Running Lighthouse tests against production build...");

	// Set environment variables for Lighthouse
	const env = {
		...process.env,
		LIGHTHOUSE_MIN_SCORE: process.env["LIGHTHOUSE_MIN_SCORE"] ?? "90",
		LIGHTHOUSE_URL: PREVIEW_URL,
		PLAYWRIGHT_BASE_URL: PREVIEW_URL,
		TMPDIR: "/tmp",
		CHROME_PATH:
			process.env["CHROME_PATH"] ??
			`${process.env["HOME"]}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`,
	};

	const playwrightArgs = [
		"playwright",
		"test",
		"e2e/specs/lighthouse.spec.ts",
		"--project=chromium",
		"--reporter=list",
		"--workers=1",
		"--timeout=120000",
	];

	const res = spawnSync("npx", playwrightArgs, {
		stdio: "inherit",
		shell: true,
		env,
	});

	const exitCode = typeof res.status === "number" ? res.status : EXIT_FAILURE;

	sLog("Cleaning up preview server...");
	cleanup();

	if (exitCode === EXIT_SUCCESS) {
		sLog("Lighthouse tests passed!");
	} else {
		sError(`Lighthouse tests failed with exit code ${exitCode}`);
	}

	process.exit(exitCode);
}

main();
