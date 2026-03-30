import { mkdir } from "node:fs/promises";

/**
 * Ensure a directory exists before later filesystem work.
 *
 * @param dir - Directory path to create.
 * @returns A promise that resolves once the directory exists.
 */
export default async function ensureDir(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
}
