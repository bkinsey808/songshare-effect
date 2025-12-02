#!/usr/bin/env bun

// Usage: bun scripts/filterTsErrors.ts <filename> < input.txt
// Utility script to filter TypeScript error output for easier parsing and reporting.
// Intended for use in CI or local scripts to extract relevant error lines.
/* oxlint-disable jest/require-hook */
import { normalize, basename } from "node:path";
import { createInterface } from "node:readline";

import { log as sLog, error as sError } from "./utils/scriptLogger";

/** CLI numeric helpers */
const ARGV_FILE_INDEX = 2;
const EXIT_USAGE = 1;

/** The normalized relative path of the target file provided as a CLI argument. */
const targetFileRel =
	process.argv[ARGV_FILE_INDEX] !== undefined && process.argv[ARGV_FILE_INDEX] !== ""
		? normalize(process.argv[ARGV_FILE_INDEX].replace(/^\./, ""))
		: undefined;

/** The base filename of the target file, used for comparison with error output. */
const targetFileBase =
	typeof targetFileRel === "string" && targetFileRel !== "" ? basename(targetFileRel) : undefined;
if (
	typeof targetFileRel === "string" &&
	targetFileRel !== "" &&
	typeof targetFileBase === "string" &&
	targetFileBase !== ""
) {
	// OK — keep running
} else {
	sError("Usage: bun scripts/filterTsErrors.ts <filename> < input.txt");
	process.exit(EXIT_USAGE);
}

/** Regex to match TypeScript error header lines (filename:line:col - error) */
const fileRegex = /^([^\s:]+\.tsx?):\d+:\d+\s*-\s*error/;

/** Flag to indicate if we are currently printing error details for the target file */
let printing = false;

/** Readline interface to process stdin line by line */
const rl = createInterface({ input: process.stdin, terminal: false });

/** Remove ANSI color codes for clean matching */
function stripAnsi(str: string): string {
	// Build the ANSI escape regex without embedding a raw control character in source
	// (avoid \x1b or \u001b literals which ESLint flags). Use `String.fromCharCode`.
	const ESC_CODE = 27; // ESC (0x1B)
	// Use fromCodePoint which has better Unicode semantics for control characters
	const esc = String.fromCodePoint(ESC_CODE);
	const ansiRegex = new RegExp(`${esc}\\[[0-9;]*m`, "g");
	return str.replace(ansiRegex, "");
}

// Main loop: process each line from stdin
rl.on("line", (line: string) => {
	// Strip color codes for matching
	const cleanLine: string = stripAnsi(line);
	// Check if the line is an error header for a TypeScript file
	const match: RegExpMatchArray | null = fileRegex.exec(cleanLine);
	if (match) {
		const [, matchedPath] = match;
		if (matchedPath === undefined) {
			return;
		}
		// Extract the filename from the error header
		const currentFileBase: string = basename(matchedPath);
		if (currentFileBase === targetFileBase) {
			// If the error is for the target file, start printing
			printing = true;

			// Print the error header line immediately (with color)
			// This script needs to output filtered results to stdout
			sLog(line);
		} else {
			// Otherwise, stop printing until the next relevant error
			printing = false;
		}

		// Always return after an error header
		return;
	}
	// If currently printing, output the line (error details)
	if (printing) {
		// This script needs to output filtered results to stdout
		sLog(line);
	}
});
