import { execFileSync } from "child_process";

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

	console.warn("🔧 Running ESLint fix on generated files...");
	try {
		execFileSync(
			params.cliPath,
			["--no-warn-ignored", ...params.files, "--fix"],
			{
				cwd: params.projectRoot,
				stdio: "pipe",
			},
		);
		console.warn("✅ ESLint fix completed on generated schemas");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("⚠️  ESLint fix failed:", message);
	}
}
