#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { safeArrayGet } from "@/shared/utils/safe";

function isNonRelativeImport(line: string): boolean {
	// Matches "from 'pkg'", "from "pkg"", and `require('pkg')` but ignores
	// relative imports starting with './' or '../'. Case-insensitive.
	// Allow a whitelist of packages that are safe to include in Pages
	// Functions — e.g. `effect` — by returning false when they are the package
	// being imported.
	const match = /(?:from|require\()\s*["'](?!\.\/?|\.\.\/)([^"']+)["']/i.exec(
		line,
	);
	if (!match) {
		return false;
	}

	const pkg = String((match[1] ?? "").toString().split("/")[0]);
	const allowed = new Set(["effect"]);
	return !allowed.has(pkg);
}

async function scanDir(
	dir: string,
): Promise<{ file: string; line: number; code: string }[]> {
	const results: { file: string; line: number; code: string }[] = [];
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...(await scanDir(full)));
			continue;
		}
		if (!entry.isFile()) {
			continue;
		}
		// Only check TypeScript sources copied into the functions dist directory.
		// The bundling step emits minified JS bundles which contain many string
		// literals that look like non-relative imports and cause false positives.
		// We only need to validate .ts files (shared sources) here.
		if (!entry.name.endsWith(".ts")) {
			continue;
		}

		const content = readFileSync(full, "utf8");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			// lines[i] can be undefined in TypeScript's type system if index is out-of-bounds;
			// coerce to empty string to keep types simple and avoid errors while scanning.
			const rawLine = safeArrayGet(lines, i) ?? "";
			const line = String(rawLine);
			if (isNonRelativeImport(line)) {
				results.push({ file: full, line: i + 1, code: line.trim() });
			}
		}
	}

	return results;
}

async function main(): Promise<number> {
	const target = process.argv[2] ?? "dist/functions";
	if (!existsSync(target)) {
		console.error("Target path does not exist:", target);
		return 2;
	}

	const matches = await scanDir(target);
	if (matches.length === 0) {
		console.log("No non-relative imports found in", target);
		return 0;
	}

	console.error("ERROR: Found non-relative imports in", target);
	for (const match of matches) {
		console.error(`${match.file}:${match.line}  ${match.code}`);
	}

	return 1;
}

void main().then((code) => process.exit(code));
