import { execFileSync } from "child_process";

import { warn as sWarn } from "../../../utils/scriptLogger";

export function runPrettierWrite(
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

	sWarn("🔧 Running Prettier on generated files...");
	try {
		execFileSync(params.cliPath, ["--write", ...params.files], {
			cwd: params.projectRoot,
			stdio: "inherit",
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		sWarn("⚠️  Prettier format failed:", message);
	}
}
