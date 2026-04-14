import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const ARGV_START = 2;
const FAILURE_EXIT_CODE = 1;
const TRUE = "true";
const FALSE = "false";
const ROOT = join(import.meta.dir, "../../..");
const API_DIR = join(ROOT, "api");
const LEGACY_DEV_VAR_FILES = [".dev.vars", ".dev.vars.production", ".dev.vars.staging"] as const;

function removeLegacyDevVarFiles(): void {
	for (const filename of LEGACY_DEV_VAR_FILES) {
		const fullPath = join(API_DIR, filename);
		if (existsSync(fullPath)) {
			rmSync(fullPath, { force: true });
		}
	}
}

const env: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
	if (value !== undefined) {
		env[key] = value;
	}
}
env["CLOUDFLARE_INCLUDE_PROCESS_ENV"] = TRUE;
env["CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV"] = FALSE;

removeLegacyDevVarFiles();

const result = Bun.spawnSync(["wrangler", "dev", "--no-enable-containers", ...process.argv.slice(ARGV_START)], {
	cwd: API_DIR,
	env,
	stdout: "inherit",
	stderr: "inherit",
	stdin: "inherit",
});

process.exitCode = result.exitCode ?? FAILURE_EXIT_CODE;
