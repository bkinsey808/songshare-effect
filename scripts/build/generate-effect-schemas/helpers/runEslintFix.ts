import { execFileSync } from "child_process";

import { warn as sWarn } from "../../../utils/scriptLogger";

export function runEslintFix(
	params: Readonly<{
		projectRoot: string;
		files: ReadonlyArray<string>;
		cliPath: string;
	}>,
): void {
	const NO_FILES = 0;
	if (params.files.length === NO_FILES) {
		return;
	}

	sWarn("🔧 Running ESLint fix on generated files...");
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
