#!/usr/bin/env node
/*
  Replacement for the bash wrapper: starts `npm run dev`, parses its stdout
  and starts Playwright as soon as the frontend and api readiness lines appear.
  Streams logs to /tmp/playwright-dev-*.log and ensures processes are cleaned up.

  Usage: node ./scripts/playwright-run-and-test.js [playwright args...]
*/
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const LOG_DIR = process.env.LOG_DIR || "/tmp";
const CLIENT_LOG = path.join(LOG_DIR, "playwright-dev-client.log");
const API_LOG = path.join(LOG_DIR, "playwright-dev-api.log");

// Ensure logs exist (truncate)
try {
  fs.writeFileSync(CLIENT_LOG, "", { flag: "w" });
  fs.writeFileSync(API_LOG, "", { flag: "w" });
} catch (e) {
  // ignore
}

const dev = spawn("npm", ["run", "dev"], { shell: true });

const clientStream = fs.createWriteStream(CLIENT_LOG, { flags: "a" });
const apiStream = fs.createWriteStream(API_LOG, { flags: "a" });

let frontendReady = false;
let apiReady = false;

const startTime = Date.now();
const TIMEOUT = Number(process.env.PLAYWRIGHT_DEV_TIMEOUT || 120000); // ms

function checkReadyAndMaybeStart(playwrightArgs) {
  if (frontendReady && apiReady) {
    startPlaywright(playwrightArgs);
  }
}

let playwrightProcess = null;
let startedPlaywright = false;

function startPlaywright(playwrightArgs) {
  if (startedPlaywright) return;
  startedPlaywright = true;
  console.log("Dev servers ready — starting Playwright tests");
  const args = ["playwright", "test", ...playwrightArgs];
  // Use npx to run playwright consistently
  playwrightProcess = spawn("npx", args, { shell: true, stdio: "inherit" });

  playwrightProcess.on("exit", (code, signal) => {
    // Ensure dev process is killed when Playwright finishes
    try {
      if (!dev.killed) dev.kill();
    } catch (e) {}
    process.exit(code === null ? (signal ? 1 : 0) : code);
  });
}

// Forward and parse stdout/stderr from dev
dev.stdout.setEncoding("utf8");
dev.stderr.setEncoding("utf8");

const handleLine = (line) => {
  const trimmed = line.trim();
  // Write everything to both logs so we have full context
  clientStream.write(line + "\n");
  apiStream.write(line + "\n");
  // Detect frontend ready lines (Vite): look for 5173 and 'Local:' or '127.0.0.1'
  if (!frontendReady && /(?:Local:).*5173|https:\/\/127\.0\.0\.1:5173|https:\/\/localhost:5173/.test(trimmed)) {
    frontendReady = true;
    console.log("Detected frontend ready ->", trimmed);
  }
  // Detect API ready line produced by wrangler
  if (!apiReady && /Ready on .*:8787/.test(trimmed)) {
    apiReady = true;
    console.log("Detected API ready ->", trimmed);
  }
  // If both ready, start Playwright immediately
  checkReadyAndMaybeStart(process.argv.slice(2));
};

// Buffer stdout into lines
let stdoutBuf = "";
dev.stdout.on("data", (chunk) => {
  stdoutBuf += chunk;
  let lines = stdoutBuf.split(/\r?\n/);
  stdoutBuf = lines.pop() || "";
  for (const l of lines) handleLine(l);
});

let stderrBuf = "";
dev.stderr.on("data", (chunk) => {
  stderrBuf += chunk;
  let lines = stderrBuf.split(/\r?\n/);
  stderrBuf = lines.pop() || "";
  for (const l of lines) handleLine(l);
});

dev.on("exit", (code, signal) => {
  console.log("Dev process exited", { code, signal });
  // If Playwright hasn't started yet, exit with failure
  if (!startedPlaywright) {
    console.error("Dev servers exited before Playwright started. Check logs:", CLIENT_LOG, API_LOG);
    process.exit(1);
  }
});

// Timeout checker
const interval = setInterval(() => {
  if (startedPlaywright) {
    clearInterval(interval);
    return;
  }
  if (Date.now() - startTime > TIMEOUT) {
    console.error("Timed out waiting for dev servers to become ready (timeout ms):", TIMEOUT);
    console.error("Last output written to:", CLIENT_LOG, API_LOG);
    try {
      if (!dev.killed) dev.kill();
    } catch (e) {}
    process.exit(1);
  }
}, 500);

// Forward SIGINT/SIGTERM to children and attempt graceful shutdown
const shutdown = () => {
  try {
    if (playwrightProcess && !playwrightProcess.killed) playwrightProcess.kill();
  } catch (e) {}
  try {
    if (dev && !dev.killed) dev.kill();
  } catch (e) {}
  process.exit(1);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Make the file executable when created
try {
  fs.chmodSync(new URL(import.meta.url).pathname, 0o755);
} catch (e) {}

// Print where logs go
console.log(`Playwright dev+test: logs -> ${CLIENT_LOG}, ${API_LOG}`);
