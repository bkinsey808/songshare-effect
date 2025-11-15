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
			await copyDir(srcPath, destPath);
		} else if (entry.isFile()) {
			await copyFileSafe(srcPath, destPath);
		}
	}
}
