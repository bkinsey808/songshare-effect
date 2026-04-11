import path from "node:path";

import collectSkillFiles from "./collectSkillFiles";
import countLines from "./countLines";

export type CheckResult = {
	hasError: boolean;
	checkedCount: number;
	errors: string[];
};

/** Default max lines; mirrors the CLI script. DO NOT EDIT! */
export const DEFAULT_MAX_LINES = 300;

/** Default search dirs; mirrors the CLI script. */
export const DEFAULT_SEARCH_DIRS = ["agents", "skills"];

/**
 * Pure function that checks shared skill and agent markdown files.
 * Returns found errors and a checked count instead of calling process.exit.
 */
export type CheckOptions = {
	maxLines?: number;
	searchDirs?: string[];
	collect?: typeof collectSkillFiles;
	count?: typeof countLines;
};

export async function checkSkillFiles(
	repoRoot: string,
	opts: CheckOptions = {},
): Promise<CheckResult> {
	const {
		maxLines = DEFAULT_MAX_LINES,
		searchDirs = DEFAULT_SEARCH_DIRS,
		collect = collectSkillFiles,
		count = countLines,
	} = opts;
	const allFiles: string[] = [];

	for (const dir of searchDirs) {
		const abs = path.join(repoRoot, dir);
		// allow collect to be async; callers may run in parallel if desired
		// oxlint-disable-next-line no-await-in-loop
		allFiles.push(...(await collect(abs)));
	}

	const errors: string[] = [];
	for (const file of allFiles) {
		const lineCount = count(file);
		if (lineCount > maxLines) {
			const rel = path.relative(repoRoot, file);
			errors.push(
					`error: ${rel} has ${lineCount} lines (max ${maxLines}). Please split or trim this guidance file.`,
				);
			}
		}

	const ZERO = 0;
	return {
		hasError: errors.length !== ZERO,
		checkedCount: allFiles.length,
		errors,
	};
}

export default checkSkillFiles;
