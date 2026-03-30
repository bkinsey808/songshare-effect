import { copyFile } from "node:fs/promises";
import path from "node:path";

import ensureDir from "./ensureDir";

/**
 * Copy a file after ensuring its destination directory exists.
 *
 * @param src - Source file path.
 * @param dest - Destination file path.
 * @returns A promise that resolves after the copy completes.
 */
export default async function copyFileSafe(src: string, dest: string): Promise<void> {
	await ensureDir(path.dirname(dest));
	await copyFile(src, dest);
}
