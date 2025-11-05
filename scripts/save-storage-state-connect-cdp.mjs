#!/usr/bin/env node
/* eslint-disable no-undef */
/*
  Connect to an already-running Chrome instance with remote debugging enabled
  (started on Windows with --remote-debugging-port=9222 and the profile dir you signed into),
  then export a Playwright storageState JSON file to `tests/storageState.json`.

  Usage (from WSL):
    # On Windows, start Chrome with the profile you used to sign in:
    # (run this on Windows PowerShell or a Windows shortcut)
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\<you>\songshare-effect-chrome-profile"

    # Keep that Chrome running. From WSL, run:
    REMOTE_DEBUGGING_URL="http://127.0.0.1:9222" node scripts/save-storage-state-connect-cdp.mjs

*/
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import process from "process";

const REMOTE_DEBUGGING_URL =
	process.env.REMOTE_DEBUGGING_URL || "http://127.0.0.1:9222";
const OUTPUT =
	process.env.OUTPUT ||
	path.resolve(process.cwd(), "tests", "storageState.json");
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

async function ensureDirForFile(filePath) {
	const dir = path.dirname(filePath);
	await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
	console.log(
		`Connecting to remote debugging endpoint: ${REMOTE_DEBUGGING_URL}`,
	);

	let browser;
	try {
		// Attempt to connect over CDP to the running Windows Chrome
		browser = await chromium.connectOverCDP(REMOTE_DEBUGGING_URL, {
			timeout: 15000,
		});
	} catch (err) {
		console.error("Failed to connect to Chrome over CDP:", err.message || err);
		console.error(
			"Make sure Chrome is running on Windows with: --remote-debugging-port=9222 and that you can reach http://127.0.0.1:9222 from WSL.",
		);
		process.exitCode = 2;
		return;
	}

	try {
		// Use an existing context if present (this will represent the real profile), otherwise create one
		let context;
		const existing = browser.contexts();
		if (existing && existing.length > 0) {
			context = existing[0];
			console.log("Using existing browser context from connected Chrome.");
		} else {
			console.log(
				"No existing contexts found; creating a temporary context and navigating to the app to ensure cookies are loaded.",
			);
			context = await browser.newContext();
			const page = await context.newPage();
			// navigate to the app origin so cookies relevant to the site are loaded into the context
			try {
				await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 });
			} catch (err) {
				console.warn(
					`Warning: navigation to ${BASE_URL} failed:`,
					err.message || err,
				);
				// still continue — context may still have cookies from the profile
			}
		}

		await ensureDirForFile(OUTPUT);
		console.log(`Saving storageState to ${OUTPUT} ...`);
		await context.storageState({ path: OUTPUT });
		console.log("Saved storageState successfully.");
	} catch (err) {
		console.error("Error while extracting storage state:", err.message || err);
		process.exitCode = 3;
	} finally {
		try {
			await browser.close();
		} catch {
			/* ignore */
		}
	}
}

// Run
main().catch((err) => {
	console.error("Unhandled error:", err);
	process.exit(1);
});
