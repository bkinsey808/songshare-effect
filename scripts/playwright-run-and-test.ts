#!/usr/bin/env bun
/* eslint-disable sonarjs/no-os-command-from-path, sonarjs/no-control-regex, no-control-regex */
import { type ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const LOG_DIR = process.env["LOG_DIR"] || "/tmp";
const CLIENT_LOG = path.join(LOG_DIR, "playwright-dev-client.log");
const API_LOG = path.join(LOG_DIR, "playwright-dev-api.log");

try {
	fs.writeFileSync(CLIENT_LOG, "", { flag: "w" });
	fs.writeFileSync(API_LOG, "", { flag: "w" });
} catch {
	// Ignore log file creation errors
}

const dev: ChildProcess = spawn("npm", ["run", "dev"], { shell: true });
const clientStream = fs.createWriteStream(CLIENT_LOG, { flags: "a" });
const apiStream = fs.createWriteStream(API_LOG, { flags: "a" });

let frontendReady = false;
let apiReady = false;
let startedPlaywright = false;
let playwrightProcess: ChildProcess | undefined;

const startTime = Date.now();
const TIMEOUT = Number(process.env["PLAYWRIGHT_DEV_TIMEOUT"] || 120_000);

function stripAnsi(input: string): string {
	return input.replace(/\u001b\[[0-9;]*m/g, "");
}

function startPlaywrightIfReady(): void {
	if (!frontendReady || !apiReady || startedPlaywright) {
		return;
	}
	startedPlaywright = true;
	// eslint-disable-next-line no-console
	console.log("Dev servers ready — starting Playwright tests");
	const args = ["playwright", "test", ...process.argv.slice(2)];
	playwrightProcess = spawn("npx", args, { shell: true, stdio: "inherit" });
	playwrightProcess.on("exit", (code, signal) => {
		try {
			if (!dev.killed) {
				dev.kill();
			}
		} catch {
			// Ignore kill errors
		}
		let exitCode: number;
		if (code === null) {
			exitCode = signal ? 1 : 0;
		} else {
			exitCode = code;
		}
		const finalCode = exitCode ?? 0;
		process.exit(finalCode);
	});
}

function handleLine(raw: string): void {
	clientStream.write(`${raw}\n`);
	apiStream.write(`${raw}\n`);
	const line = stripAnsi(raw).trim();

	if (
		!frontendReady &&
		/(Local:.*5173|https?:\/\/127\.0\.0\.1:5173|https?:\/\/localhost:5173)/.test(
			line,
		)
	) {
		frontendReady = true;
		// eslint-disable-next-line no-console
		console.log("Detected frontend ready ->", line);
	}

	if (!apiReady && /Ready on .*:8787/.test(line)) {
		apiReady = true;
		// eslint-disable-next-line no-console
		console.log("Detected API ready ->", line);
	}

	startPlaywrightIfReady();
}

if (dev.stdout) {
	dev.stdout.setEncoding("utf8");
	let buf = "";
	dev.stdout.on("data", (chunk: string) => {
		buf += chunk;
		const lines = buf.split(/\r?\n/);
		buf = lines.pop() || "";
		for (const line of lines) {
			handleLine(line);
		}
	});
}

if (dev.stderr) {
	dev.stderr.setEncoding("utf8");
	let buf2 = "";
	dev.stderr.on("data", (chunk: string) => {
		buf2 += chunk;
		const lines = buf2.split(/\r?\n/);
		buf2 = lines.pop() || "";
		for (const line of lines) {
			handleLine(line);
		}
	});
}

dev.on("exit", () => {
	console.error("Dev process exited");
	if (!startedPlaywright) {
		console.error(
			"Dev servers exited before Playwright started. Check logs:",
			CLIENT_LOG,
			API_LOG,
		);
		process.exit(1);
	}
});

const interval = setInterval(() => {
	if (startedPlaywright) {
		clearInterval(interval);
		return;
	}
	if (Date.now() - startTime > TIMEOUT) {
		console.error(
			"Timed out waiting for dev servers to become ready (ms):",
			TIMEOUT,
		);
		console.error("Last output written to:", CLIENT_LOG, API_LOG);
		try {
			if (!dev.killed) {
				dev.kill();
			}
		} catch {
			// Ignore kill errors
		}
		process.exit(1);
	}
}, 500);

function shutdown(): void {
	try {
		if (playwrightProcess && !playwrightProcess.killed) {
			playwrightProcess.kill();
		}
	} catch {
		// Ignore kill errors
	}
	try {
		if (dev && !dev.killed) {
			dev.kill();
		}
	} catch {
		// Ignore kill errors
	}
	process.exit(1);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// eslint-disable-next-line no-console
console.log(`Playwright dev+test: logs -> ${CLIENT_LOG}, ${API_LOG}`);
