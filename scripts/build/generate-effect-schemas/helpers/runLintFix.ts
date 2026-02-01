import { execFileSync } from "node:child_process";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

export default function runLintFix(
	params: Readonly<{
		projectRoot: string;
		files: readonly string[];
		cliPath: string;
	}>,
): void {
	const NO_FILES = 0;
	if (params.files.length === NO_FILES) {
		return;
	}

	try {
		execFileSync(
			params.cliPath,
			["--fix", ...params.files],
			{
				cwd: params.projectRoot,
				stdio: "pipe",
			},
		);
		sWarn("✅ oxlint fix completed on generated schemas");
	} catch (error: unknown) {
		const message: string | undefined = extractErrorMessage(error, "Unknown error");
		sWarn("⚠️  oxlint fix failed:", message);
	}
}
