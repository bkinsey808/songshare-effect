#!/usr/bin/env bun
// Usage: bun run scripts/list-lint-rule-violations.bun.ts

/// <reference types="bun" />

import isRecord from "../shared/src/type-guards/isRecord";

const OXLINT_CMD = ["bunx", "oxlint", "--format", "json", "."] as const;
const ZERO = 0;
const ONE = 1;
const PREVIEW_LENGTH = 2000;

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

async function main(): Promise<void> {
	const { stdout: lintOutput, stderr: lintStderr, exitCode } = await runOxlint();
	if (lintOutput.length === ZERO) {
		console.error("No lint output found.");
		if (lintStderr) {
			console.error("oxlint stderr:", lintStderr);
		}
		throw new TypeError("No lint output found.");
	}

	let lintResults: { rule: string }[] = [];
	try {
		const parsedOutput: unknown = JSON.parse(lintOutput);

		// oxlint may return either a top-level array or an object with a
		// `diagnostics` array. Accept both shapes and normalize.
		let diagnosticsArray: unknown[] | undefined = undefined;
		if (Array.isArray(parsedOutput)) {
			diagnosticsArray = parsedOutput as unknown[];
		} else if (
			typeof parsedOutput === "object" &&
			parsedOutput !== null &&
			"diagnostics" in parsedOutput
		) {
			// safe access; diagnostics may be unknown[] or undefined
			const possible = (parsedOutput as Record<string, unknown>)["diagnostics"];
			if (Array.isArray(possible)) {
				diagnosticsArray = possible;
			} else {
				diagnosticsArray = undefined;
			}
		} else {
			diagnosticsArray = undefined;
		}

		if (Array.isArray(diagnosticsArray)) {
			// Normalize diagnostics: different versions may expose the rule id under
			// different keys (e.g. `rule`, `code`, `name`). Use Reflect.get to
			// safely access dynamic properties without unsafe assertions.
			lintResults = diagnosticsArray.flatMap((lintItem: unknown) => {
				if (!isRecord(lintItem)) {
					return [];
				}
				const maybeRule = lintItem["rule"] ?? lintItem["code"] ?? lintItem["name"];
				if (typeof maybeRule === "string") {
					return [{ rule: maybeRule }];
				}
				return [];
			});
		} else {
			console.error(
				"Oxlint output parsed but has no diagnostics array. Raw output:",
				lintOutput.slice(ZERO, PREVIEW_LENGTH),
			);
			throw new TypeError("Oxlint output has no diagnostics array");
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

	// Count violations per rule
	const ruleCounts: Record<string, number> = {};
	for (const lintResult of lintResults) {
		const ruleName = lintResult.rule;
		ruleCounts[ruleName] = (ruleCounts[ruleName] ?? ZERO) + ONE;
	}

	// Sort by count descending using toSorted (ES2023 lib enabled)
	const sortedRules: [string, number][] = Object.entries(ruleCounts).toSorted(
		([, countA], [, countB]) => countB - countA,
	);

	// Print results
	for (const [ruleName, violationCount] of sortedRules) {
		console.warn(`${ruleName}: ${violationCount}`);
	}
}

try {
	await main();
} catch (error: unknown) {
	// eslint-disable-next-line no-console
	console.error(error);
}

const __isModule = true;
export default __isModule;
