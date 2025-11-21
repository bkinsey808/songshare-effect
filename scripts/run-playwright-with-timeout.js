#!/usr/bin/env node

// Compatibility shim: redirect node-based call to the bun wrapper script.
const { spawn } = require("child_process");

const bunArgs = [
	"./scripts/run-playwright-with-timeout.bun.ts",
	...process.argv.slice(2),
];
const child = spawn("bun", bunArgs, { stdio: "inherit", env: process.env });

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
	console.error("Failed to start Bun wrapper:", err);
	process.exit(1);
});
