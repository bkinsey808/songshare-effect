import { readdirSync } from "node:fs";
import { extname, join } from "node:path";

import { IGNORED, TS_EXTS } from "./constants";

/**
 * Recursively traverse `dir` and invoke `onFile` for each TypeScript file found.
 *
 * @param dir - Directory to traverse
 * @param onFile - Callback invoked with the file path for each matching file
 * @returns void
 */
export default function walk(dir: string, onFile: (filePath: string) => void): void {
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (IGNORED.has(entry.name)) {
			// skip ignored directories
		} else {
			const filePath = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(filePath, onFile);
			} else if (entry.isFile() && TS_EXTS.has(extname(entry.name))) {
				onFile(filePath);
			}
		}
	}
}
