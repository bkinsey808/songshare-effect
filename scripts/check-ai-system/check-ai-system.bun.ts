#!/usr/bin/env bun
/**
 * Checks the shared AI guidance system for stale migration paths and missing
 * custom-agent frontmatter fields.
 *
 * Exit codes:
 *   0 — all checked files are consistent
 *   1 — one or more consistency errors were found
 */

import path from "node:path";

import { checkAiSystem } from "./checkAiSystem";

const EXIT_CODE_FAILURE = 1;

async function main(): Promise<void> {
	const repoRoot = path.resolve(import.meta.dir, "../..");
	const result = await checkAiSystem(repoRoot);

	if (result.hasError) {
		for (const msg of result.errors) {
			process.stderr.write(`${msg}\n`);
		}
		process.exit(EXIT_CODE_FAILURE);
	}

	process.stdout.write(
		`✓ Checked ${result.checkedCount} AI guidance file(s) — no stale paths found.\n`,
	);
}

await main();
