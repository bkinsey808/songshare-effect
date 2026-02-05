#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";

import { ONE, ZERO } from "@/shared/constants/shared-constants";

import { IGNORED, TS_EXTS } from "./constants";
import walk from "./walk";

/**
 * Check JSDoc spacing: flags JSDoc block occurrences that are immediately
 * preceded by non-empty lines that DO NOT end with `{` (i.e., where a single
 * blank line should be present). This mirrors the SKILL rule but allows the
 * formatter exception when the JSDoc sits at the top of a block.
 */

/**
 * Check a single file for JSDoc spacing violations according to the
 * repository's comment conventions (SKILL rules). Looks for JSDoc blocks
 * that should be preceded by a single blank line (formatter exception for
 * top-of-blocks is honored).
 *
 * @param filePath - Path to the file to inspect
 * @returns Array of issues; each item contains `line` and `reason` fields
 */
function checkFile(filePath: string): { line: number; reason: string }[] {
	const text = readFileSync(filePath, "utf8");
	const lines = text.split("\n");
	const issues: { line: number; reason: string }[] = [];

	for (let idx = ZERO; idx < lines.length; ) {
		const raw = lines[idx] ?? "";
		// Only process when a JSDoc block starts on this line
		if (raw.trim().startsWith("/**")) {
			// locate end of JSDoc
			let end = idx;
			while (end < lines.length && !(lines[end] ?? "").includes("*/")) {
				end += ONE;
			}

			const nextLine = (lines[end + ONE] ?? "").trim();
			const documentsSymbol =
				/^(export\s+|export\s+default|function\s+|class\s+|const\s+|let\s+|type\s+|interface\s+)/.test(
					nextLine,
				);

			if (documentsSymbol && idx !== ZERO) {
				const prev = (lines[idx - ONE] ?? "").trim();
				const prevHasBlank = prev === "";
				const prevEndsWithBrace = /\{\s*$/.test(prev);

				if (!prevHasBlank && !prevEndsWithBrace) {
					issues.push({
						line: idx + ONE,
						reason: `missing blank line before JSDoc (previous: "${prev}")`,
					});
				}
			}

			// advance past this block regardless
			idx = end + ONE;
		} else {
			// Not a JSDoc start; advance one line
			idx += ONE;
		}
	}

	return issues;
}

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
		process.exit(ZERO);
	}

	console.warn(`Found ${total} JSDoc spacing issue(s):`);
	for (const [file, items] of Object.entries(found)) {
		console.warn(`\n${file}:`);
		for (const it of items) {
			console.warn(`  line ${it.line}  ${it.reason}`);
		}
	}
	process.exit(ONE);
}

main();
