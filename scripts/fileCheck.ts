#!/usr/bin/env bun
// Usage: bun src/features/scripts/fileCheck.ts src/App.tsx
import { spawnSync } from "child_process";

const file = process.argv[2];

if (!file) {
	console.error("Usage: bun src/features/scripts/fileCheck.ts <file>");
	process.exit(1);
}

// eslint-disable-next-line no-console -- This is a CLI script that needs to output information
console.log(`Running TypeScript and ESLint checks on file: ${file} .\n`);

// eslint-disable-next-line no-console -- This is a CLI script that needs to output reminders
console.log(`Reminders:
(1) Run this command iteratively on this file until no errors are reported.
(2) Don't ask a question like: "Would you like me to fix all of these issues now?",
assume the answer is yes.
(3) Don't ask a question like: "Would you like me to review and fix the syntax error in...,
assume the answer is yes.
(4) Don't ask a question like: "Would you like me to start fixing the issues..."
assume the answer is yes.
(5) Top priority issues are the type issues.
(6) ESLint issues are second priority.
(7) Solve lint errors before warnings.
(8) The least important lint warning is max-lines-per-function . Only fix that
after all other errors and warnings have been addressed.
(9) If you have a question about prioritization, run this command again and follow instructions.
(10) It is acceptable to ask to if you can use a disable lint rule comment like this:
// eslint-disable-next-line unicorn/no-null as a temporary workaround,
to move forward, but make sure to add a code comment explaining exactly why it is needed.
(11) Be very careful not to change any logic, make sure to ask before adding any new props
when invoking a component.
(12) Don't guess what a type should be. If unsure, use unknown and ask for clarification.
(13) Don't add placeholder variables if not necessary. For example:
\`export default function App(): ReactElement {\`
is better than
\`export default function App(_props: Record<string, unknown>): ReactElement {\`
(14) Prefer ReactElement (which is an ambient type over React.ReactElement)
(15) If you run into an issue where a type null is required, you can use a disable lint comment
as the final step.
(16) Make sure there are no useless new code comments like \`// ...existing code..\`.
(17) Make sure to run this file-check command as the final step before considering a prompt to be complete.`);

const tsCheck = spawnSync(
	"npx",
	["typescript-file-checker", "--pretty", "--project", "tsconfig.json"],
	{ stdio: ["ignore", "pipe", "pipe"] },
);

function filterNpmWarnings(output: Buffer | string | undefined): string {
	if (output === undefined) {
		return "";
	}
	const str = typeof output === "string" ? output : output.toString();
	return str
		.split("\n")
		.filter((line: string) => !line.includes("npm warn"))
		.join("\n");
}

const combinedTsCheck = tsCheck.stdout.toString() + tsCheck.stderr.toString();
const filteredTsCheck = filterNpmWarnings(combinedTsCheck);
spawnSync("bun", [require.resolve("./filterTsErrors.ts"), file], {
	input: filteredTsCheck,
	stdio: ["pipe", "inherit", "inherit"],
});

const eslintResult = spawnSync(
	"eslint",
	["--color", "--no-ignore", "--fix", file],
	{
		stdio: ["ignore", "pipe", "pipe"],
	},
);
const combinedEslint =
	eslintResult.stdout.toString() + eslintResult.stderr.toString();
const filteredEslint = filterNpmWarnings(combinedEslint);

if (filteredEslint && filteredEslint.trim().length > 0) {
	// eslint-disable-next-line no-console -- This is a CLI script that needs to output ESLint results
	console.log(filteredEslint);
}

/** Only exit non-zero if type errors are found for the specific file */
function hasTypeErrorsForFile(tsOutput: string, filePath: string): boolean {
	// Normalize file path for matching (absolute or relative)
	const relFile: string = filePath.startsWith(process.cwd() + "/")
		? filePath.replace(process.cwd() + "/", "")
		: filePath;
	const absFile: string = filePath;
	// Match lines that reference the file and have error
	// eslint-disable-next-line security/detect-non-literal-regexp
	const errorRegex = new RegExp(
		`^(?:${relFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${absFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\:(\\d+)\\:(\\d+) - error`,
		"m",
	);
	return errorRegex.test(tsOutput);
}

const typeErrorForFile = hasTypeErrorsForFile(filteredTsCheck, file);
const eslintFailed = eslintResult.status !== 0;
if (typeErrorForFile || eslintFailed) {
	process.exit(1);
}
