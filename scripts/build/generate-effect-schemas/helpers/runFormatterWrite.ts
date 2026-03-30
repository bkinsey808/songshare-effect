import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative } from "node:path";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Runs the formatter in write mode for generated files that currently exist.
 *
 * @param params - Formatter CLI path, project root, and candidate files to format.
 * @returns void
 */
export default function runFormatterWrite(
	params: Readonly<{
		projectRoot: string;
		files: readonly string[];
		cliPath: string;
	}>,
): void {
	const NO_FILES = 0;
	const existingFiles = params.files.filter((filePath) => existsSync(filePath));
	if (existingFiles.length === NO_FILES) {
		return;
	}
	const relativeFiles = existingFiles.map((filePath) => relative(params.projectRoot, filePath));

	try {
		execFileSync(params.cliPath, ["--write", "--no-error-on-unmatched-pattern", ...relativeFiles], {
			cwd: params.projectRoot,
			stdio: "pipe",
		});
	} catch (error: unknown) {
		const message: string | undefined = extractErrorMessage(error, "Unknown error");
		sWarn("⚠️  oxfmt format failed:", message);
	}
}
