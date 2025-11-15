import { readdir } from "node:fs/promises";
import * as path from "node:path";

export type FileCallback = (filePath: string) => Promise<void>;

export async function walkFiles(dir: string, cb: FileCallback): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await walkFiles(entryPath, cb);
		} else if (entry.isFile()) {
			await cb(entryPath);
		}
	}
}
