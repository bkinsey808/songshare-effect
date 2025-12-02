import { execFileSync } from "node:child_process";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";

export default function runEslintFix(
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
			["--no-warn-ignored", ...params.files, "--fix"],
			{
				cwd: params.projectRoot,
				stdio: "pipe",
			},
		);
		sWarn("✅ ESLint fix completed on generated schemas");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		sWarn("⚠️  ESLint fix failed:", message);
	}
}
