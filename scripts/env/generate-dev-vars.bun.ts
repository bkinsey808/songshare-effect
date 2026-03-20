import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { buildDevVarsContent, parseWorkerVarNames } from "./generate-dev-vars";

const DEFAULT_SERVICE = "songshare-dev";
const NOT_FOUND = -1;
const NEXT_ARG = 1;
const SUCCESS_EXIT_CODE = 0;
const EMPTY_STRING = "";

const scriptDir = dirname(import.meta.path || import.meta.url.replace("file://", ""));
const workerVarsFile = join(scriptDir, "../../config/worker-vars.list");
const devVarsFile = join(scriptDir, "../../api/.dev.vars");

if (!existsSync(workerVarsFile)) {
	throw new Error(`config/worker-vars.list not found: ${workerVarsFile}`);
}

const serviceIdx = process.argv.indexOf("--service");
const service =
	serviceIdx === NOT_FOUND ? DEFAULT_SERVICE : (process.argv[serviceIdx + NEXT_ARG] ?? DEFAULT_SERVICE);
const varNames = parseWorkerVarNames(readFileSync(workerVarsFile, "utf8"));
const values: Record<string, string> = {};

for (const varName of varNames) {
	const proc = Bun.spawnSync(["keyring", "get", service, varName]);
	const value = proc.stdout.toString().trim();
	if (proc.exitCode === SUCCESS_EXIT_CODE && value !== EMPTY_STRING) {
		values[varName] = value;
		console.warn(`  ✓ ${varName}`);
	} else {
		console.warn(`  - ${varName} not set in keyring (${service}), skipping`);
	}
}

writeFileSync(devVarsFile, buildDevVarsContent(varNames, values), "utf8");
console.warn(`\nWrote ${devVarsFile}`);
