#!/usr/bin/env bun
// Usage: bun scripts/filterTsErrors.ts <filename> < input.txt
// Utility script to filter TypeScript error output for easier parsing and reporting.
// Intended for use in CI or local scripts to extract relevant error lines.
import path from "node:path";
import readline from "node:readline";

/** The normalized relative path of the target file provided as a CLI argument. */
const targetFileRel = process.argv[2]
	? path.normalize(process.argv[2].replace(/^\./, ""))
	: undefined;

/** The base filename of the target file, used for comparison with error output. */
const targetFileBase = targetFileRel ? path.basename(targetFileRel) : undefined;
if (!targetFileRel) {
	console.error("Usage: bun scripts/filterTsErrors.ts <filename> < input.txt");
	process.exit(1);
}

/** Regex to match TypeScript error header lines (filename:line:col - error) */
const fileRegex = /^([^\s:]+\.ts[x]?):\d+:\d+\s*-\s*error/;

/** Flag to indicate if we are currently printing error details for the target file */
let printing = false;

/** Readline interface to process stdin line by line */
const rl = readline.createInterface({ input: process.stdin, terminal: false });

/** Remove ANSI color codes for clean matching */
function stripAnsi(str: string): string {
	return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// Main loop: process each line from stdin
rl.on("line", (line: string) => {
	// Strip color codes for matching
	const cleanLine: string = stripAnsi(line);
	// Check if the line is an error header for a TypeScript file
	const match: RegExpMatchArray | null = cleanLine.match(fileRegex);
	if (match) {
		// Extract the filename from the error header
		const currentFileBase: string = path.basename(match[1]);
		if (currentFileBase === targetFileBase) {
			// If the error is for the target file, start printing
			printing = true;
			console.log(line); // Print the error header line immediately (with color)
		} else {
			// Otherwise, stop printing until the next relevant error
			printing = false;
		}
		return; // Always return after an error header
	}
	// If currently printing, output the line (error details)
	if (printing) {
		console.log(line);
	}
});
