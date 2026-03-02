import { readFileSync } from "node:fs";

/**
 * Counts the number of lines in a UTF-8 text file.
 *
 * @param filePath - Absolute path to the file to read.
 * @returns The number of newline-delimited lines in the file.
 */
export default function countLines(filePath: string): number {
	const content = readFileSync(filePath, "utf8");
	return content.split(/\r?\n/).length;
}
