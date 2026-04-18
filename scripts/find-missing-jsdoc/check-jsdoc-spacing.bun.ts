#!/usr/bin/env bun
import { existsSync } from "node:fs";

import { ONE, ZERO } from "@/shared/constants/shared-constants";

import { checkFile } from "./checkFile";
import { IGNORED, TS_EXTS } from "./constants";
import walk from "./walk";

/**
 * Command-line entry point for the JSDoc spacing checker.
 * Scans TypeScript source files in the repository and prints a summary of
 * spacing issues (if any) to stderr, exiting with non-zero on failure.
 *
 * @returns void
 */
function main(): void {
	const found: Record<string, { line: number; reason: string }[]> = {};
	walk(".", (filePath: string) => {
		const isTsFile = [...TS_EXTS].some((ext) => filePath.endsWith(ext));
		if (!isTsFile) {
			return;
		}

		const isIgnoredPath = [...IGNORED].some((part) => filePath.includes(part));
		if (isIgnoredPath) {
			return;
		}

		if (!existsSync(filePath)) {
			return;
		}

		const issues = checkFile(filePath);
		if (issues.length > ZERO) {
			found[filePath] = issues;
		}
	});

	const total = Object.values(found).reduce((sum, arr) => sum + arr.length, ZERO);
	if (total === ZERO) {
		console.warn("✅ No JSDoc spacing problems found (exceptions applied).");
		return;
	}

	console.warn(`Found ${total} JSDoc spacing issue(s):`);
	for (const [file, items] of Object.entries(found)) {
		console.warn(`\n${file}:`);
		for (const it of items) {
			console.warn(`  line ${it.line}  ${it.reason}`);
		}
	}
	process.exitCode = ONE;
}

if (import.meta.main) {
	main();
}
