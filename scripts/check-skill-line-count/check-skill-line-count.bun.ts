#!/usr/bin/env bun
/**
 * Checks that no SKILL.md file under .github/agents or .github/skills exceeds
 * the maximum allowed line count. This keeps agent skill files concise and
 * easy to read.
 *
 * Exit codes:
 *   0 — all files are within the limit
 *   1 — one or more files exceed the limit (errors printed to stderr)
 */

import path from "node:path";

import { checkSkillFiles } from "./checkSkillFiles";

/** Process exit code used when one or more files exceed the line limit. */
const EXIT_CODE_FAILURE = 1;

async function main(): Promise<void> {
	const repoRoot = path.resolve(import.meta.dir, "../..");

	const result = await checkSkillFiles(repoRoot);

	if (result.hasError) {
		for (const msg of result.errors) {
			process.stderr.write(`${msg}\n`);
		}
		process.exit(EXIT_CODE_FAILURE);
	}

	process.stdout.write(
		`✓ Checked ${result.checkedCount} markdown file(s) — all within 300 lines.\n`,
	);
}

await main();
