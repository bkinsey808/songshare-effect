#!/usr/bin/env bun
/// <reference types="bun" />
// Usage: bun run scripts/find-files-by-lint-rule.bun.ts <rule-substring>

// Always run the type-aware checks so calling code receives type-aware diagnostics
import { ZERO } from "@/shared/constants/shared-constants";
const OXLINT_CMD = ["bunx", "oxlint", "--type-aware", "--format", "json", "."] as const;
const PREVIEW_LENGTH = 2000;
const ARGV_SLICE = 2;
const USAGE_EXIT = 2;
const NO_OUTPUT_EXIT = 3;
const JSON_SHAPE_EXIT = 4;
const RUNTIME_ERROR_EXIT = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function runOxlint(): Promise<{
	stdout: string;
	stderr: string;
	exitCode: number;
}> {
	const bunProcess = Bun.spawn({
		cmd: [...OXLINT_CMD],
		stdout: "pipe",
		stderr: "pipe",
	});
	if (bunProcess.stdout === undefined || bunProcess.stderr === undefined) {
		throw new Error("Failed to spawn oxlint process");
	}

	const exitCode = await bunProcess.exited;
	const stdout = await new Response(bunProcess.stdout).text();
	const stderr = await new Response(bunProcess.stderr).text();
	if (stderr) {
		console.error("oxlint stderr:", stderr);
	}
	return { stdout, stderr, exitCode };
}

function extractCode(diag: unknown): string | undefined {
	if (!isRecord(diag)) {
		return undefined;
	}
	const codeCandidate = diag["code"] ?? diag["rule"] ?? diag["ruleId"];
	return typeof codeCandidate === "string" ? codeCandidate : undefined;
}

function extractFilename(diag: unknown): string | undefined {
	if (!isRecord(diag)) {
		return undefined;
	}
	const filenameCandidate = diag["filename"] ?? diag["fileName"] ?? diag["file"];
	return typeof filenameCandidate === "string" ? filenameCandidate : undefined;
}

async function main(): Promise<void> {
	const args = process.argv.slice(ARGV_SLICE);
	if (args.length === ZERO) {
		console.error("Usage: bun run scripts/find-files-by-lint-rule.bun.ts <rule-substring>");
		// oxlint-disable-next-line no-process-exit
		process.exit(USAGE_EXIT);
	}
	const [maybeRuleArg] = args;
	if (typeof maybeRuleArg !== "string" || maybeRuleArg.length === ZERO) {
		console.error("Usage: bun run scripts/find-files-by-lint-rule.bun.ts <rule-substring>");
		// oxlint-disable-next-line no-process-exit
		process.exit(USAGE_EXIT);
	}
	const ruleArg = maybeRuleArg;

	const { stdout: lintOutput, stderr: lintStderr, exitCode } = await runOxlint();
	if (!lintOutput || lintOutput.length === ZERO) {
		console.error("No oxlint JSON output available.");
		if (lintStderr) {
			console.error("oxlint stderr:", lintStderr);
		}
		// still exit non-zero because nothing to parse
		// oxlint-disable-next-line no-process-exit
		process.exit(NO_OUTPUT_EXIT);
	}

	let diagnostics: unknown[] = [];
	try {
		const parsed: unknown = JSON.parse(lintOutput);
		if (Array.isArray(parsed)) {
			diagnostics = parsed;
		} else if (isRecord(parsed) && Array.isArray(parsed["diagnostics"])) {
			diagnostics = parsed["diagnostics"] as unknown[];
		} else {
			console.error(
				"Unexpected oxlint JSON shape. Raw (truncated):",
				lintOutput.slice(ZERO, PREVIEW_LENGTH),
			);
			// oxlint-disable-next-line no-process-exit
			process.exit(JSON_SHAPE_EXIT);
		}
	} catch (error) {
		console.error("Failed to parse oxlint output as JSON.");
		console.error("Exit code:", exitCode);
		if (lintStderr) {
			console.error("oxlint stderr:", lintStderr);
		}
		console.error("Raw stdout (truncated):", lintOutput.slice(ZERO, PREVIEW_LENGTH));
		throw error;
	}

	const files = new Set<string>();
	for (const diagnosticItem of diagnostics) {
		const ruleCode = extractCode(diagnosticItem);
		if (typeof ruleCode !== "string" || ruleCode.length === ZERO) {
			// skip diagnostics without a rule code
		} else if (ruleCode.includes(ruleArg)) {
			const filename = extractFilename(diagnosticItem);
			if (typeof filename === "string" && filename.length > ZERO) {
				files.add(filename);
			}
		}
	}
	const sorted = [...files].toSorted((left, right) => left.localeCompare(right));
	for (const filename of sorted) {
		console.warn(filename);
	}
}

try {
	await main();
} catch (error) {
	// oxlint-disable-next-line no-console
	console.error(error);
	// oxlint-disable-next-line no-process-exit
	process.exit(RUNTIME_ERROR_EXIT);
}

const __isModule = true;
export default __isModule;
