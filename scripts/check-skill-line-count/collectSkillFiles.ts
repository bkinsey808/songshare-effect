import { readdir, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Recursively collects all SKILL.md file paths under a directory.
 *
 * @param dir - The absolute directory path to walk.
 * @returns A flat array of absolute file paths for every SKILL.md file found.
 */
export default async function collectSkillFiles(dir: string): Promise<string[]> {
	const results: string[] = [];
	let names: string[] = [];
	try {
		names = await readdir(dir);
	} catch {
		// Directory may not exist in all environments — silently skip.
		return results;
	}
	for (const name of names) {
		const full = path.join(dir, name);
		// oxlint-disable-next-line no-await-in-loop
		const info = await stat(full);
		if (info.isDirectory()) {
			// oxlint-disable-next-line no-await-in-loop
			const nested = await collectSkillFiles(full);
			for (const item of nested) {
				results.push(item);
			}
		} else if (info.isFile() && name === "SKILL.md") {
			results.push(full);
		}
	}
	return results;
}
