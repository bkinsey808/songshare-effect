import { collectFlagValues, parseKeyValueLines } from "./env-utils";

const NEXT_IDX = 1;
const SLICE_START = 0;
const MISSING = -1;

export type RunWithEnvArgs = Readonly<{
	commandArgs: readonly string[];
	configFiles: readonly string[];
	envNames: readonly string[];
	secretsLists: readonly string[];
	services: readonly string[];
}>;

export function parseRunWithEnvArgs(args: readonly string[]): RunWithEnvArgs {
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
		services: [...envNames.map((name) => `songshare-${name}`), ...collectFlagValues(optArgs, "--service")],
	};
}

export function parseConfigFile(text: string): Record<string, string> {
	return parseKeyValueLines(text);
}
