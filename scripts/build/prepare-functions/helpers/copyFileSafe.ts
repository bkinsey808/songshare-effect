import { copyFile } from "node:fs/promises";
import * as path from "node:path";

import { ensureDir } from "./ensureDir";

export async function copyFileSafe(src: string, dest: string): Promise<void> {
	await ensureDir(path.dirname(dest));
	await copyFile(src, dest);
}
