import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import parseKeyValueLines from "./parseKeyValueLines";
import parseRunWithEnvArgs from "./parseRunWithEnvArgs";
import resolveSecretSource from "./resolveSecretSource";

const ARGV_START = 2;
const SECRETS_MIN_LINE_LENGTH = 2;
const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;
const EMPTY_STRING = "";
const WARNING_PREFIX = "[run-with-env]";

const parsed = parseRunWithEnvArgs(process.argv.slice(ARGV_START));
const root = join(import.meta.dir, "../../..");
const isCI =
	(typeof process.env["CI"] === "string" && process.env["CI"] !== EMPTY_STRING) ||
	(typeof process.env["GITHUB_ACTIONS"] === "string" &&
		process.env["GITHUB_ACTIONS"] !== EMPTY_STRING);
const keyringPath = Bun.which("keyring");
let warnedAboutMissingKeyring = false;

type AssignSecretFromKeyringOptions = Readonly<{
	name: string;
	resolvedKeyringPath: string | null;
	service: string;
	targetEnv: Record<string, string>;
}>;

function warnMissingKeyringOnce(): void {
	if (warnedAboutMissingKeyring) {
		return;
	}

	console.warn(
		`${WARNING_PREFIX} keyring is unavailable in CI; keeping existing environment values and skipping keyring lookups.`,
	);
	warnedAboutMissingKeyring = true;
}

function readSecretFromKeyring(
	resolvedKeyringPath: string | null,
	service: string,
	name: string,
): string | undefined {
	if (resolvedKeyringPath === null) {
		throw new Error(`keyring unexpectedly became unavailable while loading ${name}`);
	}

	const proc = Bun.spawnSync([resolvedKeyringPath, "get", service, name]);
	const value = proc.stdout.toString().trim();
	return proc.exitCode === SUCCESS_EXIT_CODE && value !== EMPTY_STRING ? value : undefined;
}

function assignSecretFromKeyring(options: AssignSecretFromKeyringOptions): void {
	const { targetEnv, resolvedKeyringPath, service, name } = options;
	const value = readSecretFromKeyring(resolvedKeyringPath, service, name);
	if (value !== undefined) {
		targetEnv[name] = value;
	}
}

const env: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
	if (value !== undefined) {
		env[key] = value;
	}
}

for (const configFile of parsed.configFiles) {
	const fullPath = join(root, configFile);
	if (!existsSync(fullPath)) {
		throw new Error(`Config file not found: ${fullPath}`);
	}
	Object.assign(env, parseKeyValueLines(readFileSync(fullPath, "utf8")));
}

for (let i = 0; i < parsed.services.length; i++) {
	const service = parsed.services[i];
	const listPath = parsed.secretsLists[i];
	const listFile = listPath === undefined ? undefined : join(root, listPath);

	if (service !== undefined && service !== EMPTY_STRING) {
		if (listFile !== undefined && !existsSync(listFile)) {
			throw new Error(`Secrets list not found: ${listFile}`);
		}

		const secretNames =
			listFile === undefined
				? []
				: readFileSync(listFile, "utf8")
						.split(/\r?\n/)
						.map((line) => line.trim())
						.filter((line) => line.length >= SECRETS_MIN_LINE_LENGTH && !line.startsWith("#"));

		for (const name of secretNames) {
			const source = resolveSecretSource({
				currentValue: env[name],
				isCI,
				keyringAvailable: keyringPath !== null,
				secretName: name,
			});

			if (source === "keyring") {
				assignSecretFromKeyring({
					targetEnv: env,
					resolvedKeyringPath: keyringPath,
					service,
					name,
				});
			} else if (source === "skip") {
				warnMissingKeyringOnce();
			}
		}
	}
}

const result = Bun.spawnSync([...parsed.commandArgs], {
	env,
	stdout: "inherit",
	stderr: "inherit",
	stdin: "inherit",
	cwd: root,
});

process.exitCode = result.exitCode ?? FAILURE_EXIT_CODE;
