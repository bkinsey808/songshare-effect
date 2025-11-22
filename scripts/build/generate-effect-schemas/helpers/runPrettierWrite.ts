
import { execFileSync } from "child_process";

export function runPrettierWrite(
	params: Readonly<{
		projectRoot: string;
		files: ReadonlyArray<string>;
		cliPath: string;
	}>,
): void {
	if (params.files.length === 0) {
		return;
	}

	console.log("🔧 Running Prettier on generated files...");
	try {
		execFileSync(params.cliPath, ["--write", ...params.files], {
			cwd: params.projectRoot,
			stdio: "inherit",
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("⚠️  Prettier format failed:", message);
	}
}
