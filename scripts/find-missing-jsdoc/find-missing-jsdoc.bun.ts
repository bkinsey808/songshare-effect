#!/usr/bin/env bun
/**
 * scripts/find-missing-jsdoc.bun.ts
 *
 * Bun-compatible companion to scripts/find-missing-jsdoc.ts. Usage:
 *
 *   bun run ./scripts/find-missing-jsdoc.bun.ts
 *   # or make executable and run directly:
 *   chmod +x ./scripts/find-missing-jsdoc.bun.ts
 *   ./scripts/find-missing-jsdoc.bun.ts
 *
 * The script uses the TypeScript compiler API to scan for exported
 * function/class/const-arrow symbols missing a JSDoc comment immediately
 * above them. Exit code is 0 when clean, 1 when issues found.
 */

import { existsSync } from "node:fs";

import { ZERO } from "@/shared/constants/shared-constants";

import analyzeFile from "./analyzeFile";
import { EXIT_ERROR, EXIT_OK } from "./constants";
import parseArgs from "./parseArgs";
import walk from "./walk";

/**
 * Entry point for the script.
 * @returns void
 */
function main(): void {
	const { dirs, format } = parseArgs();
	const found: Record<string, { line: number; col: number; name: string; kind: string }[]> = {};

	for (const scanDir of dirs) {
		if (existsSync(scanDir)) {
			walk(scanDir, (filePath) => {
				try {
					const issues = analyzeFile(filePath);
					if (issues.length > ZERO) {
						found[filePath] = issues;
					}
				} catch (error) {
					console.error(`ERR parsing ${filePath}:`, error);
				}
			});
		} else {
			// Directory does not exist in this workspace - skip
		}
	}

	const total = Object.values(found).reduce((sum, arr) => sum + arr.length, ZERO);
	if (total === ZERO) {
		console.warn("✅ No exported function/class/const-arrow symbols missing JSDoc found.");
		process.exit(EXIT_OK);
	}

	if (format === "github") {
		for (const [file, items] of Object.entries(found)) {
			for (const it of items) {
				console.warn(
					`${file}:${it.line}:${it.col}: Missing JSDoc for exported ${it.kind} '${it.name}'`,
				);
			}
		}
	} else {
		console.warn(`Found ${total} exported symbols missing JSDoc:`);
		for (const [file, items] of Object.entries(found)) {
			console.warn(`\n${file}:`);
			for (const it of items) {
				console.warn(`  line ${it.line}:${it.col}  ${it.kind}  ${it.name}`);
			}
		}
	}

	// Exit with non-zero when issues found - bun supports process.exit
	process.exit(EXIT_ERROR);
}

// Run main
main();
