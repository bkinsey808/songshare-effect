import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Runs lint autofixes for generated files that currently exist.
 *
 * @param params - Linter CLI path, project root, and candidate files to fix.
 * @returns void
 */
export default function runLintFix(
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

	try {
		execFileSync(params.cliPath, ["--fix", ...existingFiles], {
			cwd: params.projectRoot,
			stdio: "pipe",
		});
		sWarn("✅ oxlint fix completed on generated schemas");
	} catch (error: unknown) {
		const message: string | undefined = extractErrorMessage(error, "Unknown error");
		sWarn("⚠️  oxlint fix failed:", message);
	}
}
