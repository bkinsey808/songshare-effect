import { execFileSync } from "node:child_process";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";

export default function runFormatterWrite(
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
		execFileSync(params.cliPath, ["--write", ...params.files], {
			cwd: params.projectRoot,
			stdio: "inherit",
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		sWarn("⚠️  Prettier format failed:", message);
	}
}
