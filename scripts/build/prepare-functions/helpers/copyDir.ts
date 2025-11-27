import { readdir } from "node:fs/promises";
import * as path from "node:path";

import { copyFileSafe } from "./copyFileSafe";
import { ensureDir } from "./ensureDir";

export async function copyDir(srcDir: string, destDir: string): Promise<void> {
	await ensureDir(destDir);
	const entries = await readdir(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			// Intentionally await here to perform copying sequentially and avoid overwhelming
			// the filesystem with too many concurrent operations.
			// eslint-disable-next-line no-await-in-loop
			await copyDir(srcPath, destPath);
		} else if (entry.isFile()) {
			// Intentionally await here for the same reason as above.
			// eslint-disable-next-line no-await-in-loop
			await copyFileSafe(srcPath, destPath);
		}
	}
}
