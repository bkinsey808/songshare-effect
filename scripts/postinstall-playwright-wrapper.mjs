#!/usr/bin/env node
/* eslint-disable no-undef */
/*
 A small cross-platform wrapper script used as `postinstall` in package.json.
 Prefers Bun if available; otherwise falls back to `npx playwright install --with-deps`.
*/
import { spawnSync } from "child_process";

// (This script prints status for contributors)

function run(cmd, args) {
	const opts = {
		stdio: "inherit",
		env: process.env,
		shell: process.platform === "win32",
	};
	const res = spawnSync(cmd, args, opts);
	return typeof res.status === "number" ? res.status : 1;
}

try {
	// If an explicit opt-out is set, or running inside CI, skip the browser install.
	// This small guard prevents the fallback `npx` path from attempting a
	// system-level install on CI or in Cloudflare's build environment where
	// privilege escalation is disallowed.
	if (
		process.env.PLAYWRIGHT_SKIP_BROWSER_INSTALL === "1" ||
		process.env.CI === "true"
	) {
		console.log(
			"Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 or CI=true",
		);
		process.exit(0);
	}
	// Delegator wrapper: prefer Bun if present, otherwise fall back to `npx`.
	// The canonical logic (including any CI / PLAYWRIGHT_SKIP_BROWSER_INSTALL
	// handling) lives in `postinstall-playwright.bun.ts` so we keep this file
	// intentionally small and cross-platform.
	// Detect bun presence; if available, use bun to execute the existing Bun TS script.
	if (run("bun", ["-v"]) === 0) {
		process.exit(run("bun", ["./scripts/postinstall-playwright.bun.ts"]));
	}
	// Otherwise fall back to npx Playwright installer which is available with node/npm
	process.exit(run("npx", ["playwright", "install", "--with-deps"]));
} catch (err) {
	console.error("postinstall wrapper failed:", err);
	process.exit(1);
}
