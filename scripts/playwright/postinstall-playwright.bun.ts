#!/usr/bin/env bun
/* oxlint-disable sonarjs/no-os-command-from-path,promise/avoid-new */
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

// small helper sentinel used in the installer
import { ZERO } from "@/shared/constants/shared-constants";

import { error as sError, warn as sWarn } from "../utils/scriptLogger";
import browsersAlreadyInstalled from "./helpers/browsersAlreadyInstalled";
import findBrowserExecutable from "./helpers/findBrowserExecutable";
import libsMissingForExecutable from "./helpers/libsMissingForExecutable";
import maybePromptInstallDeps from "./helpers/maybePromptInstallDeps";

// This script runs automatically after `npm install` when invoked as the
// `postinstall` script in package.json. It attempts to download Playwright
// browsers unless you opt out by setting PLAYWRIGHT_SKIP_BROWSER_INSTALL=1.

async function runInstaller(): Promise<void> {
	// ZERO is a module-level constant
	const EXIT_NON_ZERO = 1;
	if (process.env["PLAYWRIGHT_SKIP_BROWSER_INSTALL"] === "1") {
		sWarn("Skipping Playwright browser install because PLAYWRIGHT_SKIP_BROWSER_INSTALL=1");
		return;
	}

	// Use module-level helpers to test whether browsers exist.

	if (browsersAlreadyInstalled()) {
		sWarn("Playwright browsers already present in cache — skipping postinstall installer.");
		return;
	}

	try {
		sWarn(
			"Ensuring Playwright browsers are installed (bun script postinstall). This may take a minute...",
		);
		// `npx playwright install` is idempotent and will no-op if already installed.
		// new Promise is used intentionally to wait for spawn events
		// oxlint-disable-next-line promise/avoid-new
		const isCI =
			(typeof process.env["CI"] === "string" && process.env["CI"] !== "") ||
			(typeof process.env["GITHUB_ACTIONS"] === "string" && process.env["GITHUB_ACTIONS"] !== "");
		await new Promise<void>((resolve, reject) => {
			const args = ["playwright", "install"];
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

		// After installing browsers, perform checks using module helpers
		// (findBrowserExecutable, libsMissingForExecutable) that live at
		// module scope so linter rules are satisfied.

		// Now that the install Promise has resolved, verify system libs and
		// prompt the user in interactive sessions if `install-deps` is needed.
		// (This runs after the browsers have been installed.)
		// Try to discover an installed browser executable and check for missing libs
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
		let exeAfter: string | undefined = undefined;
		for (const candidateCache of candidatesAfter) {
			exeAfter = findBrowserExecutable(candidateCache);
			if (exeAfter !== undefined && exeAfter !== "") {
				break;
			}
		}

		if (exeAfter !== undefined && libsMissingForExecutable(exeAfter)) {
			sWarn("Detected missing system libraries required by Playwright after installing browsers.");
			// Hands off: delegate the interactive prompt / instructions to helper
			await maybePromptInstallDeps(isCI, exeAfter);
		}
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
