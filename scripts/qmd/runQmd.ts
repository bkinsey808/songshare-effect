import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const NOISE_FILTER = new RegExp(
	String.raw`^(?:--|CMAKE|CMake|Call Stack|xpack/|llama\.cpp/|node-llama|Vulkan|SpawnError|createError|ChildProcess|Not searching|ERROR OMG|cmake-js|QMD Warning|\(found version\))`,
);
const BOOTSTRAP_COMMANDS = new Set(["search", "vsearch", "query", "get", "ls", "status"]);
const CONFIG_FILE_NAME = "index.yml";
const ZERO = 0;

type RunQmdOptions = {
	readonly repoRoot: string;
};

type RunProcessOptions = {
	readonly suppressOutput?: boolean;
};

async function runQmd(args: readonly string[], options: RunQmdOptions): Promise<number> {
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

function ensureDir(path: string): void {
	mkdirSync(path, { recursive: true });
}

function ensureConfigFile(configDir: string, repoRoot: string): void {
	const configPath = resolve(configDir, CONFIG_FILE_NAME);
	if (existsSync(configPath)) {
		return;
	}

	const configContents = `collections:
  skills:
    path: ${repoRoot}/skills
    pattern: "**/*.md"
    context:
      "": Reusable task guidance skill files for AI coding agents — covers Hono, Effect-TS, React, Zustand, Supabase, Playwright, unit testing, linting, and more
  docs:
    path: ${repoRoot}/docs
    pattern: "**/*.md"
    context:
      "": Project documentation — architecture, coding rules, server patterns, auth system, AI system layout, deployment, and developer workflows
`;

	writeFileSync(configPath, configContents, "utf8");
}

async function bootstrapLocalIndex(options: {
	readonly command: string;
	readonly indexPath: string;
	readonly globalIndexPath: string;
	readonly qmdBin: string;
}): Promise<void> {
	if (existsSync(options.indexPath)) {
		return;
	}

	if (options.globalIndexPath !== options.indexPath && existsSync(options.globalIndexPath)) {
		copyFileSync(options.globalIndexPath, options.indexPath);
		return;
	}

	if (!BOOTSTRAP_COMMANDS.has(options.command)) {
		return;
	}

	await runProcess([options.qmdBin, "update"], { suppressOutput: true });
}

async function runProcess(
	command: readonly string[],
	options: RunProcessOptions,
): Promise<{ exitCode: number; output: string }> {
	const processResult = Bun.spawn({
		cmd: [...command],
		env: process.env,
		stdout: "pipe",
		stderr: "pipe",
	});

	const [stdoutText, stderrText, exitCode] = await Promise.all([
		new Response(processResult.stdout).text(),
		new Response(processResult.stderr).text(),
		processResult.exited,
	]);

	const suppressOutput = options.suppressOutput ?? false;

	if (suppressOutput) {
		return { exitCode, output: "" };
	}

	return { exitCode, output: `${stdoutText}${stderrText}` };
}

function writeFilteredOutput(output: string): void {
	if (output.length === ZERO) {
		return;
	}

	const filteredLines = output
		.split(/\r?\n/)
		.filter((line) => !NOISE_FILTER.test(line));

	if (filteredLines.length === ZERO) {
		return;
	}

	process.stdout.write(`${filteredLines.join("\n")}\n`);
}

/**
 * Run QMD with repo-local config + index defaults and filtered output.
 * @param args - CLI arguments forwarded to qmd.
 * @param options - Repo root resolution and config.
 * @returns The qmd exit code.
 */
export default runQmd;
