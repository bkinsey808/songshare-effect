/* eslint-disable no-console */
import { execFileSync } from "child_process";

export function runEslintFix(
	params: Readonly<{
		projectRoot: string;
		files: ReadonlyArray<string>;
		cliPath: string;
	}>,
): void {
	if (params.files.length === 0) {
		return;
	}

	console.log("🔧 Running ESLint fix on generated files...");
	try {
		execFileSync(
			params.cliPath,
			["--no-warn-ignored", ...params.files, "--fix"],
			{
				cwd: params.projectRoot,
				stdio: "pipe",
			},
		);
		console.log("✅ ESLint fix completed on generated schemas");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("⚠️  ESLint fix failed:", message);
	}
}
