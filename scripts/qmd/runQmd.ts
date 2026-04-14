import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { Effect } from "effect";

import bootstrapLocalIndex from "./bootstrapLocalIndex";
import ensureConfigFile from "./ensureConfigFile";
import runProcess from "./runProcess";
import writeFilteredOutput from "./writeFilteredOutput";

const ZERO = 0;

type RunQmdOptions = {
	readonly repoRoot: string;
};

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
export default function runQmd(
	args: readonly string[],
	options: RunQmdOptions,
): Effect.Effect<number, Error> {
	return Effect.gen(function* runQmdGen() {
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
			yield* bootstrapLocalIndex({
				command: args.at(ZERO) ?? "",
				indexPath,
				globalIndexPath,
				qmdBin,
			});
		}

		const { exitCode, output } = yield* runProcess([qmdBin, ...args], { suppressOutput: false });
		yield* Effect.sync(() => {
			writeFilteredOutput(output);
		});
		return exitCode;
	});
}
