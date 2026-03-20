import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parseWorkerVarNames, resolveServiceName } from "./set-cloudflare-secrets";

const DEFAULT_ENV = "production";
const NOT_FOUND = -1;
const NEXT_ARG_OFFSET = 1;
const SUCCESS_EXIT_CODE = 0;
const EMPTY_STRING = "";
const args = process.argv;
const envIdx = args.indexOf("--env");
const envArg = envIdx === NOT_FOUND ? DEFAULT_ENV : (args[envIdx + NEXT_ARG_OFFSET] ?? DEFAULT_ENV);
const serviceIdx = args.indexOf("--service");
const serviceArg = resolveServiceName(
	envArg,
	serviceIdx === NOT_FOUND ? undefined : args[serviceIdx + NEXT_ARG_OFFSET],
);

const workerVarsFile: string = join(import.meta.dir, "../../config/worker-vars.list");

if (!existsSync(workerVarsFile)) {
	throw new Error(`config/worker-vars.list not found: ${workerVarsFile}`);
}

const varNames: string[] = parseWorkerVarNames(readFileSync(workerVarsFile, "utf8"));

console.warn(
	`Pushing worker vars to Cloudflare env "${envArg}" from keyring service "${serviceArg}"`,
);

function main(): void {
	for (const varName of varNames) {
		const proc = Bun.spawnSync(["keyring", "get", serviceArg, varName]);
		const value = proc.stdout.toString().trim();

		if (proc.exitCode !== SUCCESS_EXIT_CODE || value === EMPTY_STRING) {
			console.warn(`  - ${varName} not in keyring (${serviceArg}), skipping`);
		} else {
			console.warn(`  → ${varName}`);
			const result = Bun.spawnSync(["npx", "wrangler", "secret", "put", varName, "--env", envArg], {
				stdin: new TextEncoder().encode(value),
				stdout: "inherit",
				stderr: "inherit",
				cwd: join(import.meta.dir, "../../api"),
			});

			if (result.exitCode !== SUCCESS_EXIT_CODE) {
				throw new Error(`wrangler secret put failed for ${varName} (exit ${result.exitCode})`);
			}
		}
	}
}

try {
	main();
	console.warn("\nDone.");
} catch (error: unknown) {
	console.error(error);
	throw new Error("set-cloudflare-secrets failed", { cause: error });
}
