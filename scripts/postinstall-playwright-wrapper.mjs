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
	// Detect bun presence; if available, use bun to execute the existing Bun TS script.
	if (run("bun", ["-v"]) === 0) {
		process.exit(run("bun", ["./scripts/postinstall-playwright.bun.ts"]));
	}
	// Otherwise fall back to npx Playwright installer which is available with node/npm
	// Avoid installing OS packages in CI / GitHub Actions runners because
	// Playwright's installer may not recognise newer distro names (eg 'noble').
	// Use plain `playwright install` in CI and only include `--with-deps`
	// for local developer environments.
	const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
	const args = isCI
		? ["playwright", "install"]
		: ["playwright", "install", "--with-deps"];
	process.exit(run("npx", args));
} catch (err) {
	console.error("postinstall wrapper failed:", err);
	process.exit(1);
}
