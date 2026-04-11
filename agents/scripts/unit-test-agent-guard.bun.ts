#!/usr/bin/env bun
// Unit Test Agent file-write guard.
//
// Receives JSON on stdin (VS Code PreToolUse format) and denies any
// file-write tool call whose target path is not a test or test-util file.
//
// Allowed patterns: *.test.ts, *.test.tsx, *.test-util.ts, *.test-util.tsx

/// <reference types="bun" />

import process from "node:process";

type HookOutput = {
	hookSpecificOutput: {
		hookEventName: "PreToolUse";
		permissionDecision: "deny";
		permissionDecisionReason: string;
	};
};

const FILE_WRITE_TOOLS = new Set([
	"create_file",
	"replace_string_in_file",
	"multi_replace_string_in_file",
]);

const TEST_FILE_PATTERN = /\.(test-util|test)\.[cm]?tsx?$/;

const EXIT_OK = 0;
const EXIT_BLOCK = 2;

/** Narrows an unknown value to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/** Extracts a string field from a record, returning empty string if absent. */
function str(obj: Record<string, unknown>, key: string): string {
	const val = obj[key];
	return typeof val === "string" ? val : "";
}

/** Parses raw JSON, returning undefined on failure. */
function parseJson(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

const raw = await Bun.stdin.text();
const parsed = parseJson(raw);

if (!isRecord(parsed)) {
	process.exit(EXIT_OK);
}

const toolName = str(parsed, "tool_name") || str(parsed, "toolName");

// Only inspect file-write tools
if (!FILE_WRITE_TOOLS.has(toolName)) {
	process.exit(EXIT_OK);
}

const toolInput = parsed["tool_input"];
const filePath = isRecord(toolInput) ? str(toolInput, "filePath") : "";

if (TEST_FILE_PATTERN.test(filePath)) {
	process.exit(EXIT_OK);
}

const reason =
	filePath === ""
		? `Unit Test Agent may only edit test files (*.test.ts[x], *.test-util.ts[x]). No file path found in tool input.`
		: `Unit Test Agent may only edit test files (*.test.ts[x], *.test-util.ts[x]). Blocked: ${filePath}`;

process.stderr.write(`${reason}\n`);

const output: HookOutput = {
	hookSpecificOutput: {
		hookEventName: "PreToolUse",
		permissionDecision: "deny",
		permissionDecisionReason: reason,
	},
};

process.stdout.write(`${JSON.stringify(output)}\n`);
process.exit(EXIT_BLOCK);
