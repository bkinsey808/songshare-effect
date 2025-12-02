import { readdir } from "node:fs/promises";
/* oxlint-disable promise/prefer-await-to-callbacks */
import { join } from "node:path";

export type FileCallback = (filePath: string) => Promise<void>;

export async function walkFiles(dir: string, cb: FileCallback): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			// Intentionally await here to iterate directories sequentially and avoid spawning
			// too many concurrent callbacks which could overwhelm upstream operations.
			// oxlint-disable-next-line no-await-in-loop
			await walkFiles(entryPath, cb);
		} else if (entry.isFile()) {
			// Callbacks are awaited sequentially by design to simplify ordering and resource
			// usage during the preparation step.
			// oxlint-disable-next-line no-await-in-loop
			await cb(entryPath);
		}
	}
}
