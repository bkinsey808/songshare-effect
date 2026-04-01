import collectFlagValues from "./collectFlagValues";

const NEXT_IDX = 1;
const SLICE_START = 0;
const MISSING = -1;

type RunWithEnvArgs = Readonly<{
	commandArgs: readonly string[];
	configFiles: readonly string[];
	envNames: readonly string[];
	secretsLists: readonly string[];
	services: readonly string[];
}>;

/**
 * Parses `run-with-env.bun.ts` CLI arguments into structured fields.
 *
 * Expects a `--` separator with at least one command argument after it.
 * Before `--`, recognises:
 * - `--env <name>` — environment name; expands to a keyring service
 *   (`songshare-<name>`) and a secrets list (`config/env-secrets.<name>.list`)
 * - `--config <file>` — additional `.env`-style config file to merge
 * - `--service <name>` — explicit keyring service override
 * - `--secrets <list>` — explicit secrets list file override
 *
 * @param args - `process.argv` slice starting after the node/bun executable.
 * @returns Parsed fields ready for use by the runner script.
 * @throws If `--` is absent or no command follows it.
 */
export default function parseRunWithEnvArgs(args: readonly string[]): RunWithEnvArgs {
	const separatorIdx = args.indexOf("--");
	if (separatorIdx === MISSING || separatorIdx + NEXT_IDX >= args.length) {
		throw new Error(
			"Usage: run-with-env.bun.ts [--env <name>] [--config <file>] [--service <name>] [--secrets <list>] -- <command> [args...]",
		);
	}

	const optArgs = args.slice(SLICE_START, separatorIdx);
	const commandArgs = args.slice(separatorIdx + NEXT_IDX);
	const envNames = collectFlagValues(optArgs, "--env");
	return {
		commandArgs,
		configFiles: collectFlagValues(optArgs, "--config"),
		envNames,
		secretsLists: [
			...envNames.map((name) => `config/env-secrets.${name}.list`),
			...collectFlagValues(optArgs, "--secrets"),
		],
		services: [
			...envNames.map((name) => `songshare-${name}`),
			...collectFlagValues(optArgs, "--service"),
		],
	};
}
