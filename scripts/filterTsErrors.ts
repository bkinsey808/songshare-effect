#!/usr/bin/env bun
// Usage: bun scripts/filterTsErrors.ts <filename> < input.txt
// Utility script to filter TypeScript error output for easier parsing and reporting.
// Intended for use in CI or local scripts to extract relevant error lines.
import * as path from "node:path";
import * as readline from "node:readline";

/** CLI numeric helpers */
const ARGV_FILE_INDEX = 2;
const EXIT_USAGE = 1;

/** The normalized relative path of the target file provided as a CLI argument. */
const targetFileRel =
	process.argv[ARGV_FILE_INDEX] !== undefined &&
	process.argv[ARGV_FILE_INDEX] !== ""
		? path.normalize(process.argv[ARGV_FILE_INDEX].replace(/^\./, ""))
		: undefined;

/** The base filename of the target file, used for comparison with error output. */
const targetFileBase =
	targetFileRel !== undefined ? path.basename(targetFileRel) : undefined;
if (targetFileRel === undefined || targetFileBase === undefined) {
	// oxlint-disable-next-line no-console
	console.error("Usage: bun scripts/filterTsErrors.ts <filename> < input.txt");
	process.exit(EXIT_USAGE);
}

/** Regex to match TypeScript error header lines (filename:line:col - error) */
const fileRegex = /^([^\s:]+\.tsx?):\d+:\d+\s*-\s*error/;

/** Flag to indicate if we are currently printing error details for the target file */
let printing = false;

/** Readline interface to process stdin line by line */
const rl = readline.createInterface({ input: process.stdin, terminal: false });

/** Remove ANSI color codes for clean matching */
function stripAnsi(str: string): string {
	// Build the ANSI escape regex without embedding a raw control character in source
	// (avoid \x1b or \u001b literals which ESLint flags). Use `String.fromCharCode`.
	const ESC_CODE = 27; // ESC (0x1B)
	const esc = String.fromCharCode(ESC_CODE);
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
		const currentFileBase: string = path.basename(matchedPath);
		if (currentFileBase === targetFileBase) {
			// If the error is for the target file, start printing
			printing = true;

			// Print the error header line immediately (with color)
			// This script needs to output filtered results to stdout
			// oxlint-disable-next-line no-console
			console.log(line);
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
		// oxlint-disable-next-line no-console
		console.log(line);
	}
});
