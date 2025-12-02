#!/usr/bin/env bun
/* oxlint-disable sonarjs/no-os-command-from-path */
import { spawn } from "node:child_process";

import { warn as sWarn, error as sError } from "./utils/scriptLogger";

// This script runs automatically after `npm install` when invoked as the
// `postinstall` script in package.json. It attempts to download Playwright
// browsers unless you opt out by setting PLAYWRIGHT_SKIP_BROWSER_INSTALL=1.

async function runInstaller(): Promise<void> {
	const ZERO = 0;
	const EXIT_NON_ZERO = 1;
	if (process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] === "1") {
		sWarn("Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1");
		return;
	}

	try {
		sWarn(
			"Ensuring Playwright browsers are installed (bun script postinstall). This may take a minute...",
		);
		// `npx playwright install` is idempotent and will no-op if already installed.
		// new Promise is used intentionally to wait for spawn events
		// oxlint-disable-next-line promise/avoid-new
		await new Promise<void>((resolve, reject) => {
			// Avoid attempting to install OS packages in CI or GitHub Actions.
			const isCI =
				(typeof process.env["CI"] === "string" && process.env["CI"] !== "") ||
				(typeof process.env["GITHUB_ACTIONS"] === "string" && process.env["GITHUB_ACTIONS"] !== "");
			const args = isCI ? ["playwright", "install"] : ["playwright", "install", "--with-deps"];
			const installer = spawn("npx", args, {
				shell: true,
				stdio: "inherit",
				env: process.env,
			});
			installer.on("exit", (code) => {
				if (code === ZERO) {
					resolve();
					return;
				}
				reject(new Error(`playwright install failed with code ${code}`));
			});
			installer.on("error", (error) => {
				reject(error);
			});
		});
	} catch (error) {
		sError("Playwright browser install failed:", error);
		sError(
			"If the installer fails, run `npx playwright install` manually or set PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 to opt out.",
		);
		process.exit(EXIT_NON_ZERO);
	}
}

// We're in an ESM environment; prefer top-level await rather than a dangling promise
await runInstaller();
