#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { safeArrayGet } from "@/shared/utils/safe";

import { error as sError, warn as sWarn } from "./utils/scriptLogger";

function isNonRelativeImport(line: string): boolean {
	// Matches "from 'pkg'", "from "pkg"", and `require('pkg')` but ignores
	// relative imports starting with './' or '../'. Case-insensitive.
	// Allow a whitelist of packages that are safe to include in Pages
	// Functions — e.g. `effect` — by returning false when they are the package
	// being imported.
	const match = /(?:from|require\()\s*["'](?!\.\/?|\.\.\/)([^"']+)["']/i.exec(line);
	if (!match) {
		return false;
	}

	const [, raw] = match;
	const rawStr = raw ?? "";
	const segments = rawStr.toString().split("/");
	const [firstSegment] = segments;
	const pkg = String(firstSegment ?? "");
	const allowed = new Set(["effect"]);
	return !allowed.has(pkg);
}

async function scanDir(dir: string): Promise<{ file: string; line: number; code: string }[]> {
	const LINE_INDEX_INCREMENT = 1;
	const LINE_NUMBER_OFFSET = 1;
	const results: { file: string; line: number; code: string }[] = [];
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			// Intentionally await here — scanDir is recursive and we want to
			// process directories sequentially to avoid too many concurrent
			// filesystem operations.
			// oxlint-disable-next-line no-await-in-loop
			results.push(...(await scanDir(full)));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			// Only check TypeScript sources copied into the functions dist directory.
			// The bundling step emits minified JS bundles which contain many string
			// literals that look like non-relative imports and cause false positives.
			// We only need to validate .ts files (shared sources) here.

			const content = readFileSync(full, "utf8");
			const lines = content.split(/\r?\n/);
			for (let i = 0; i < lines.length; i += LINE_INDEX_INCREMENT) {
				// lines[i] can be undefined in TypeScript's type system if index is out-of-bounds;
				// coerce to empty string to keep types simple and avoid errors while scanning.
				const rawLine = safeArrayGet(lines, i) ?? "";
				const line = String(rawLine);
				if (isNonRelativeImport(line)) {
					results.push({
						file: full,
						line: i + LINE_NUMBER_OFFSET,
						code: line.trim(),
					});
				}
			}
		}
	}

	return results;
}

async function main(): Promise<number> {
	const ARGV_TARGET_INDEX = 2;
	const EXIT_NOT_FOUND = 2;
	const EXIT_ISSUES = 1;
	const EXIT_SUCCESS = 0;

	const target = process.argv[ARGV_TARGET_INDEX] ?? "dist/functions";
	if (!existsSync(target)) {
		sError("Target path does not exist:", target);
		return EXIT_NOT_FOUND;
	}

	const matches = await scanDir(target);
	const NO_MATCHES = 0;

	if (matches.length === NO_MATCHES) {
		sWarn("No non-relative imports found in", target);
		return EXIT_SUCCESS;
	}

	sError("ERROR: Found non-relative imports in", target);
	for (const match of matches) {
		sError(`${match.file}:${match.line}  ${match.code}`);
	}

	return EXIT_ISSUES;
}

// Prefer top-level await for readability and to satisfy lint rules.
// Using top-level await in this script is acceptable since it's executed in Node modern environments.
const exitCode = await main();
process.exit(exitCode);
