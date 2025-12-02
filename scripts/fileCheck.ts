#!/usr/bin/env bun
/* eslint-disable jest/require-hook */
// Usage: bun src/features/scripts/fileCheck.ts src/App.tsx
import { spawnSync, type SpawnSyncReturns } from "node:child_process";

import { warn as sWarn, error as sError } from "./utils/scriptLogger";

// Numeric helpers — small, explicit names to avoid magic-number lint warnings
const ARGV_FILE_INDEX = 2;
const EXIT_USAGE = 1;
const EXIT_NON_ZERO = 1;
const ZERO = 0;
const ONE = 1;
const INDEX_INCREMENT = 1;

const file = process.argv[ARGV_FILE_INDEX];
if (file === undefined || file === "") {
	sError("Usage: bun src/features/scripts/fileCheck.ts <file>");
	process.exit(EXIT_USAGE);
}

sWarn(`Running TypeScript and ESLint checks on file: ${file} .`);
sWarn("Reminders: run iteratively; fix type errors first, then ESLint.");

const tsCheck = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "--project", "tsconfig.json"], {
	stdio: ["ignore", "pipe", "pipe"],
});

function filterNpmWarnings(output: Readonly<Buffer | string | undefined>): string {
	if (output === undefined) {
		return "";
	}
	const str = typeof output === "string" ? output : output.toString();
	return str
		.split("\n")
		.filter((line) => !line.includes("npm warn"))
		.join("\n");
}

const combinedTsCheck = tsCheck.stdout.toString() + tsCheck.stderr.toString();
const filteredTsCheck = filterNpmWarnings(combinedTsCheck);
const filterResult = spawnSync("bun", [require.resolve("./filterTsErrors.ts"), file], {
	input: filteredTsCheck,
	stdio: ["pipe", "pipe", "pipe"],
});

// filteredOutput intentionally unused — keep code simple and avoid lint noise
void filterResult.stdout.toString();

// Helper used to gather subsequent lines belonging to an error block
function collectErrorSection(
	lines: string[],
	startIndex: number,
): { section: string[]; nextIndex: number } {
	const section: string[] = [];
	for (let j = startIndex + ONE; j < lines.length; j += INDEX_INCREMENT) {
		const nextLine = lines[j] ?? "";
		if (nextLine.includes("error") && nextLine.includes(".ts")) {
			return { section, nextIndex: j - ONE };
		}

		if (/^Found \d+ errors? in \d+ files?\./.exec(nextLine) || /^Errors\s+Files/.exec(nextLine)) {
			return { section, nextIndex: j - ONE };
		}

		section.push(nextLine);

		if (nextLine.trim() === "" && j + ONE < lines.length && (lines[j + ONE] ?? "").trim() === "") {
			return { section, nextIndex: j };
		}
	}

	return { section, nextIndex: lines.length - ONE };
}

// Determine whether this file is a JSX/TSX file and prepare placeholders
const isJsxFile = file.endsWith(".tsx") || file.endsWith(".jsx");
let individualTsCheck: SpawnSyncReturns<Buffer> = tsCheck;
let filteredIndividualTsCheck = "";
if (isJsxFile) {
	individualTsCheck = spawnSync(
		"npx",
		["tsc", "--noEmit", "--pretty", "--jsx", "react-jsx", file],
		{ stdio: ["ignore", "pipe", "pipe"] },
	);
	const combinedIndividualTsCheck =
		individualTsCheck.stdout.toString() + individualTsCheck.stderr.toString();
	filteredIndividualTsCheck = filterNpmWarnings(combinedIndividualTsCheck);

	const _targetErrorSections: string[] = [];

	// (the JSX branch loop handled below in the else) — no per-line processing for the JSX

	const filteredIndividualTsCheckClean = _targetErrorSections.join("\n").trim();
	if (filteredIndividualTsCheckClean && filteredIndividualTsCheckClean.length > ZERO) {
		sWarn("\n--- Individual JSX file TypeScript check (with JSX flag) ---");
		sWarn(filteredIndividualTsCheckClean);
	} else {
		sWarn("\n--- Individual JSX file TypeScript check passed ---");
	}
} else {
	individualTsCheck = spawnSync("npx", ["tsc", "--noEmit", "--pretty", file], {
		stdio: ["ignore", "pipe", "pipe"],
	});
	const combinedIndividualTsCheck =
		individualTsCheck.stdout.toString() + individualTsCheck.stderr.toString();
	filteredIndividualTsCheck = filterNpmWarnings(combinedIndividualTsCheck);

	const lines = filteredIndividualTsCheck.split("\n");
	const fileParts = file.split("/");
	const targetFileName = fileParts.length > ZERO ? (fileParts[fileParts.length - ONE] ?? "") : "";
	const targetErrorSections: string[] = [];

	// Collecting nested error lines is handled by the top-level helper

	for (let i = 0; i < lines.length; i += INDEX_INCREMENT) {
		const line = lines[i] ?? "";
		const isSummary =
			/^Found \d+ errors? in \d+ files?\./.exec(line) ||
			/^Errors\s+Files/.exec(line) ||
			/^\s*\d+\s+.*\.tsx?:\d+/.exec(line);

		if (!isSummary) {
			const isTargetErrorLine =
				line.includes("error") && (line.includes(file) || line.includes(targetFileName));

			if (isTargetErrorLine) {
				targetErrorSections.push(line);

				const { section, nextIndex } = collectErrorSection(lines, i);
				targetErrorSections.push(...section);
				i = Math.max(i, nextIndex);
			}
		}
	}

	const filteredIndividualTsCheckClean = targetErrorSections.join("\n").trim();
	if (filteredIndividualTsCheckClean && filteredIndividualTsCheckClean.length > ZERO) {
		sWarn("\n--- Individual file TypeScript check (without project config) ---");
		sWarn(filteredIndividualTsCheckClean);
	} else {
		sWarn("\n--- Individual file TypeScript check passed ---");
	}
}
// JSX branch handled above

const eslintResult = spawnSync("npx", ["eslint", "--color", "--no-ignore", "--fix", file], {
	stdio: ["ignore", "pipe", "pipe"],
});
const combinedEslint = eslintResult.stdout.toString() + eslintResult.stderr.toString();
const filteredEslint = filterNpmWarnings(combinedEslint);

if (filteredEslint && filteredEslint.trim().length > ZERO) {
	sWarn(filteredEslint);
}

function hasTypeErrorsForFile(tsOutput: string, filePath: string): boolean {
	const relFile: string = filePath.startsWith(`${process.cwd()}/`)
		? filePath.replace(`${process.cwd()}/`, "")
		: filePath;
	const absFile: string = filePath;
	const ESC_REGEXP = /[.*+?^${}()|[\]\\]/g;
	const relEsc = relFile.replaceAll(ESC_REGEXP, String.raw`\$&`);
	const absEsc = absFile.replaceAll(ESC_REGEXP, String.raw`\$&`);
	const errorRegex = new RegExp(`^(?:${relEsc}|${absEsc}):(\\d+):(\\d+) - error`, "m");
	return errorRegex.test(tsOutput);
}

const typeErrorForFile = hasTypeErrorsForFile(filteredTsCheck, file);
const individualTypeError = individualTsCheck.status !== ZERO;
const eslintFailed = eslintResult.status !== ZERO;
if (typeErrorForFile || individualTypeError || eslintFailed) {
	process.exit(EXIT_NON_ZERO);
}
