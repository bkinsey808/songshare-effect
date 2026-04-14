import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import bootstrapLocalIndex from "./bootstrapLocalIndex";
import ensureConfigFile from "./ensureConfigFile";
import runProcess from "./runProcess";
import writeFilteredOutput from "./writeFilteredOutput";

const ZERO = 0;

type RunQmdOptions = {
	readonly repoRoot: string;
};

// NOTE: `RunProcessOptions` has been moved to ./runProcess.ts.
// If you need the type, import it from './runProcess'. Do NOT reintroduce
// duplicate local type aliases for extracted helpers — keep types colocated
// with their implementation to avoid drift and duplicate definitions.

function ensureDir(path: string): void {
	mkdirSync(path, { recursive: true });
}

/**
 * Run QMD with repo-local config + index defaults and filtered output.
 *
 * @param args - CLI arguments forwarded to qmd.
 * @param repoRoot - Path to the repository root used to resolve `qmd` and cache/index locations.
 * @returns The qmd exit code.
 */
export default async function runQmd(
	args: readonly string[],
	options: RunQmdOptions,
): Promise<number> {
	const { repoRoot } = options;
	const qmdBin = resolve(repoRoot, "node_modules/.bin/qmd");
	const localQmdDir = resolve(repoRoot, ".cache/qmd");
	const localConfigDir = resolve(localQmdDir, "config");
	const localIndexPath = resolve(localQmdDir, "index.sqlite");
	const globalIndexPath = resolve(process.env["HOME"] ?? "/tmp", ".cache/qmd/index.sqlite");
	const indexPathEnv = process.env["INDEX_PATH"];
	const configDirEnv = process.env["QMD_CONFIG_DIR"];

	let usingLocalIndex = false;
	let usingLocalConfig = false;

	if (indexPathEnv === undefined || indexPathEnv === "") {
		process.env["INDEX_PATH"] = localIndexPath;
		usingLocalIndex = true;
	}

	if (configDirEnv === undefined || configDirEnv === "") {
		process.env["QMD_CONFIG_DIR"] = localConfigDir;
		usingLocalConfig = true;
	}

	const indexPath = process.env["INDEX_PATH"] ?? localIndexPath;
	const configDir = process.env["QMD_CONFIG_DIR"] ?? localConfigDir;

	ensureDir(dirname(indexPath));
	ensureDir(configDir);

	if (usingLocalConfig) {
		ensureConfigFile(configDir, repoRoot);
	}

	if (usingLocalIndex) {
		await bootstrapLocalIndex({
			command: args.at(ZERO) ?? "",
			indexPath,
			globalIndexPath,
			qmdBin,
		});
	}

	const { exitCode, output } = await runProcess([qmdBin, ...args], { suppressOutput: false });
	writeFilteredOutput(output);
	return exitCode;
}
