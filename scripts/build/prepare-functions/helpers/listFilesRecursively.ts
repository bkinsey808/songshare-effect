import { readdir } from "node:fs/promises";
import * as path from "node:path";

export async function listFilesRecursively(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listFilesRecursively(entryPath)));
        } else if (entry.isFile()) {
            files.push(entryPath);
        }
    }
    return files;
}
