#!/usr/bin/env node
/* oxlint-disable no-undef */
/*
 A small cross-platform wrapper script used as `postinstall` in package.json.
 Prefers Bun if available; otherwise falls back to `npx playwright install --with-deps`.
*/
import { spawnSync } from "child_process";

import { warn as sWarn, error as sError } from "./utils/scriptLogger.mjs";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

// (This script prints status for contributors)

/**
 * Run a command and return the exit status (0 == success)
 * @param {string} cmd
 * @param {string[]=} args
 * @returns {number}
 */
function run(cmd, args) {
	/** @type {import('child_process').SpawnSyncOptions} */
	const opts = {
		stdio: "inherit",
		env: process.env,
		shell: process.platform === "win32",
	};
	const res = spawnSync(cmd, args, opts);
	return typeof res.status === "number" ? res.status : EXIT_FAILURE;
}

try {
	// If an explicit opt-out is set, or running inside CI, skip the browser install.
	// This small guard prevents the fallback `npx` path from attempting a
	// system-level install on CI or in Cloudflare's build environment where
	// privilege escalation is disallowed.
	if (process.env.PLAYWRIGHT_SKIP_BROWSER_INSTALL === "1" || process.env.CI === "true") {
		sWarn(
			"Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 or CI=true",
		);
		process.exit(EXIT_SUCCESS);
	}
	// Delegator wrapper: prefer Bun if present, otherwise fall back to `npx`.
	// The canonical logic (including any CI / PLAYWRIGHT_SKIP_BROWSER_INSTALL
	// handling) lives in `postinstall-playwright.bun.ts` so we keep this file
	// intentionally small and cross-platform.
	// Detect bun presence; if available, use bun to execute the existing Bun TS script.
	if (run("bun", ["-v"]) === EXIT_SUCCESS) {
		process.exit(run("bun", ["./scripts/postinstall-playwright.bun.ts"]));
	}
	// Otherwise fall back to npx Playwright installer which is available with node/npm
	// Avoid installing OS packages in CI / GitHub Actions runners because
	// Playwright's installer may not recognise newer distro names (eg 'noble').
	// Use plain `playwright install` in CI and only include `--with-deps`
	// for local developer environments.
	// Explicitly handle nullish and empty string env values so the
	// strict-boolean-expressions rule is satisfied and we don't accidentally
	// treat an empty/undefined env var as truthy.
	const ciFlag = process.env.CI ?? process.env.GITHUB_ACTIONS;
	const isCI =
		ciFlag !== null &&
		ciFlag !== undefined &&
		ciFlag !== "" &&
		["1", "true"].includes(ciFlag.toLowerCase());
	const args = isCI ? ["playwright", "install"] : ["playwright", "install", "--with-deps"];
	process.exit(run("npx", args));
} catch (err) {
	sError("postinstall wrapper failed:", err);
	process.exit(EXIT_FAILURE);
}
