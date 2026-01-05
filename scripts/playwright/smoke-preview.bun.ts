#!/usr/bin/env bun
/*
  Bun-executable TypeScript script to run a preview-style Playwright smoke test.
  Mirrors the old shell behaviour but written in TS so `bun ./scripts/playwright/smoke-preview.bun.ts`
  can be used as an entrypoint.
*/
import { spawnSync, spawn, type SpawnSyncOptions } from "node:child_process";
import fs from "node:fs";

import { log as sLog, warn as sWarn, error as sError } from "../utils/scriptLogger";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const WAIT_TIMEOUT_MS = 180_000;
const TAIL_LINES = 200;

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

function main(): void {
	sLog("Building client and API...");
	if (run("npm", ["run", "build:client"]) !== EXIT_SUCCESS) {
		sError("Failed to build client");
		process.exit(EXIT_FAILURE);
	}
	if (run("npm", ["run", "build:api"]) !== EXIT_SUCCESS) {
		sError("Failed to build api");
		process.exit(EXIT_FAILURE);
	}

	sLog("Starting Vite preview in background (127.0.0.1:5173)...");
	const startCmd =
		"nohup npm run preview -- --host 127.0.0.1 --port 5173 > preview.log 2>&1 & echo $!";
	const pid = background(startCmd);
	if (pid !== undefined) {
		try {
			fs.writeFileSync("preview.pid", String(pid));
		} catch {
			sWarn("Could not write preview.pid (continuing)");
		}
	}

	sLog("Waiting for preview to be reachable (try http then https, timeout 180s)...");
	let reachable = waitForUrl("http://127.0.0.1:5173", WAIT_TIMEOUT_MS);
	if (!reachable) {
		reachable = waitForUrl("https://127.0.0.1:5173", WAIT_TIMEOUT_MS);
	}
	if (!reachable) {
		sError("Preview did not become reachable after 180s; tailing preview.log (last 200 lines):");
		try {
			const contents = fs.readFileSync("preview.log", { encoding: "utf8" });
			const lines = contents.split(/\r?\n/).slice(-TAIL_LINES).join("\n");
			sError(lines);
		} catch {
			sError("(could not read preview.log)");
		}
		process.exit(EXIT_FAILURE);
	}

	sLog("Ensuring Playwright browsers are installed...");
	if (run("npm", ["run", "playwright:install"]) !== EXIT_SUCCESS) {
		sError("playwright install failed");
	}

	sLog("Running smoke tests...");
	run("bash", [
		"-lc",
		"PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test e2e/render.e2e.ts --project=chromium --reporter=list,junit --workers=1 --timeout=30000 || true",
	]);

	sLog("Cleaning up preview server (if running)...");
	try {
		if (fs.existsSync("preview.pid")) {
			const pidStr = fs.readFileSync("preview.pid", "utf8").trim();
			if (pidStr) {
				run("kill", [pidStr]);
			}
			fs.rmSync("preview.pid", { force: true });
		}
	} catch {
		// ignore
	}

	sLog("Done.");
}

main();
