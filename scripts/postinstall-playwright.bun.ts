#!/usr/bin/env bun
/* eslint-disable sonarjs/no-os-command-from-path */
import { spawn } from "child_process";

// This script runs automatically after `npm install` when invoked as the
// `postinstall` script in package.json. It attempts to download Playwright
// browsers unless you opt out by setting PLAYWRIGHT_SKIP_BROWSER_INSTALL=1.

async function runInstaller(): Promise<void> {
	// Respect PLAYWRIGHT_SKIP_BROWSER_INSTALL in CI or build environments
	// and also skip automatically when running inside CI (safe default).
	if (
		process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] === "1" ||
		process.env["CI"] === "true"
	) {
		// Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1
		console.log(
			"Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 or CI=true",
		);
		return;
	}

	try {
		// Ensuring Playwright browsers are installed (bun script postinstall)
		console.log(
			"Ensuring Playwright browsers are installed (bun script postinstall). This may take a minute...",
		);
		// `npx playwright install` is idempotent and will no-op if already installed.
		await new Promise<void>((resolve, reject) => {
			const installer = spawn("npx", ["playwright", "install", "--with-deps"], {
				shell: true,
				stdio: "inherit",
				env: process.env,
			});
			installer.on("exit", (code) => {
				if (code === 0) {
					return resolve();
				}
				reject(new Error(`playwright install failed with code ${code}`));
			});
			installer.on("error", (err) => reject(err));
		});
	} catch (err) {
		console.error("Playwright browser install failed:", err);
		console.error(
			"If the installer fails, run `npx playwright install` manually or set PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 to opt out.",
		);
		process.exit(1);
	}
}

// Avoid ESLint/TS complaining about a floating promise
void runInstaller();
