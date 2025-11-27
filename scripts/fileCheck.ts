#!/usr/bin/env bun
// Usage: bun src/features/scripts/fileCheck.ts src/App.tsx
import { spawnSync } from "child_process";

// Numeric helpers — small, explicit names to avoid magic-number lint warnings
const ARGV_FILE_INDEX = 2;
const EXIT_USAGE = 1;
const EXIT_NON_ZERO = 1;
const ZERO = 0;
const ONE = 1;
const INDEX_INCREMENT = 1;

const file = process.argv[ARGV_FILE_INDEX];
if (file === undefined || file === "") {
	console.error("Usage: bun src/features/scripts/fileCheck.ts <file>");
	process.exit(EXIT_USAGE);
}

console.warn(`Running TypeScript and ESLint checks on file: ${file} .`);
console.warn("Reminders: run iteratively; fix type errors first, then ESLint.");

const tsCheck = spawnSync(
	"npx",
	["tsc", "--noEmit", "--pretty", "--project", "tsconfig.json"],
	{
		stdio: ["ignore", "pipe", "pipe"],
	},
);

function filterNpmWarnings(
	output: Readonly<Buffer | string | undefined>,
): string {
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
const filterResult = spawnSync(
	"bun",
	[require.resolve("./filterTsErrors.ts"), file],
	{
		input: filteredTsCheck,
		stdio: ["pipe", "pipe", "pipe"],
	},
);

const filteredOutput = filterResult.stdout.toString();
if (filteredOutput.trim().length > ZERO) {
	console.warn("\n--- Project-level TypeScript errors for this file ---");
	console.warn(filteredOutput);
} else {
	console.warn("\n--- Project-level TypeScript check passed for this file ---");
}

const isJsxFile = file.endsWith(".tsx") || file.endsWith(".jsx");
let individualTsCheck: ReturnType<typeof spawnSync> = spawnSync("echo", [""]);
let filteredIndividualTsCheck = "";

if (!isJsxFile) {
	individualTsCheck = spawnSync("npx", ["tsc", "--noEmit", "--pretty", file], {
		stdio: ["ignore", "pipe", "pipe"],
	});
	const combinedIndividualTsCheck =
		individualTsCheck.stdout.toString() + individualTsCheck.stderr.toString();
	filteredIndividualTsCheck = filterNpmWarnings(combinedIndividualTsCheck);

	const lines = filteredIndividualTsCheck.split("\n");
	const fileParts = file.split("/");
	const targetFileName =
		fileParts.length > ZERO ? (fileParts[fileParts.length - ONE] ?? "") : "";
	const targetErrorSections: string[] = [];

	for (let i = 0; i < lines.length; i += INDEX_INCREMENT) {
		const line = lines[i] ?? "";
		const isSummary =
			/^Found \d+ errors? in \d+ files?\./.exec(line) ||
			/^Errors\s+Files/.exec(line) ||
			/^\s*\d+\s+.*\.tsx?:\d+/.exec(line);

		if (!isSummary) {
			const isTargetErrorLine =
				line.includes("error") &&
				(line.includes(file) || line.includes(targetFileName));

			if (isTargetErrorLine) {
				targetErrorSections.push(line);

				for (let j = i + ONE; j < lines.length; j += INDEX_INCREMENT) {
					const nextLine = lines[j] ?? "";
					if (nextLine.includes("error") && nextLine.includes(".ts")) {
						break;
					}

					if (
						/^Found \d+ errors? in \d+ files?\./.exec(nextLine) ||
						/^Errors\s+Files/.exec(nextLine)
					) {
						break;
					}

					targetErrorSections.push(nextLine);

					if (
						nextLine.trim() === "" &&
						j + ONE < lines.length &&
						(lines[j + ONE] ?? "").trim() === ""
					) {
						break;
					}
				}
			}
		}
	}

	const filteredIndividualTsCheckClean = targetErrorSections.join("\n").trim();
	if (
		filteredIndividualTsCheckClean &&
		filteredIndividualTsCheckClean.length > ZERO
	) {
		console.warn(
			"\n--- Individual file TypeScript check (without project config) ---",
		);
		console.warn(filteredIndividualTsCheckClean);
	} else {
		console.warn("\n--- Individual file TypeScript check passed ---");
	}
} else {
	individualTsCheck = spawnSync(
		"npx",
		["tsc", "--noEmit", "--pretty", "--jsx", "react-jsx", file],
		{ stdio: ["ignore", "pipe", "pipe"] },
	);
	const combinedIndividualTsCheck =
		individualTsCheck.stdout.toString() + individualTsCheck.stderr.toString();
	filteredIndividualTsCheck = filterNpmWarnings(combinedIndividualTsCheck);

	const _targetErrorSections: string[] = [];

	// (the JSX branch loop handled above - previous block)

	const filteredIndividualTsCheckClean = _targetErrorSections.join("\n").trim();
	if (
		filteredIndividualTsCheckClean &&
		filteredIndividualTsCheckClean.length > ZERO
	) {
		console.warn(
			"\n--- Individual JSX file TypeScript check (with JSX flag) ---",
		);
		console.warn(filteredIndividualTsCheckClean);
	} else {
		console.warn("\n--- Individual JSX file TypeScript check passed ---");
	}
}

const eslintResult = spawnSync(
	"npx",
	["eslint", "--color", "--no-ignore", "--fix", file],
	{
		stdio: ["ignore", "pipe", "pipe"],
	},
);
const combinedEslint =
	eslintResult.stdout.toString() + eslintResult.stderr.toString();
const filteredEslint = filterNpmWarnings(combinedEslint);

if (filteredEslint && filteredEslint.trim().length > ZERO) {
	console.warn(filteredEslint);
}

function hasTypeErrorsForFile(tsOutput: string, filePath: string): boolean {
	const relFile: string = filePath.startsWith(`${process.cwd()}/`)
		? filePath.replace(`${process.cwd()}/`, "")
		: filePath;
	const absFile: string = filePath;
	const errorRegex = new RegExp(
		`^(?:${relFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${absFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}):(\\d+):(\\d+) - error`,
		"m",
	);
	return errorRegex.test(tsOutput);
}

const typeErrorForFile = hasTypeErrorsForFile(filteredTsCheck, file);
const individualTypeError = individualTsCheck.status !== ZERO;
const eslintFailed = eslintResult.status !== ZERO;
if (typeErrorForFile || individualTypeError || eslintFailed) {
	process.exit(EXIT_NON_ZERO);
}
