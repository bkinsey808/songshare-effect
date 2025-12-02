#!/usr/bin/env node

// Compatibility shim: redirect node-based call to the bun wrapper script.
import { spawn } from "node:child_process";

import { error as sError } from "./utils/scriptLogger.mjs";
const ARGV_FILE_INDEX = 2;
const EXIT_FAILURE = 1;
const ZERO = 0;

const bunArgs = [
	"./scripts/run-playwright-with-timeout.bun.ts",
	...process.argv.slice(ARGV_FILE_INDEX),
];
const child = spawn("bun", bunArgs, { stdio: "inherit", env: process.env });

child.on("exit", (code) => process.exit(code ?? ZERO));
child.on("error", (err) => {
	sError("Failed to start Bun wrapper:", err);
	process.exit(EXIT_FAILURE);
});
