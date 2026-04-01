import { MIN_LINE_LENGTH } from "./env-constants";

/**
 * Parses a newline-delimited text into a list of non-empty, non-comment lines.
 *
 * Each line is trimmed; lines shorter than `minLineLength` or starting with
 * `#` are excluded.
 *
 * @param text - Raw file content to parse.
 * @param minLineLength - Minimum trimmed line length to include (default: 1).
 * @returns Array of trimmed, non-comment lines.
 */
export default function parseListLines(text: string, minLineLength = MIN_LINE_LENGTH): string[] {
	return text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length >= minLineLength && !line.startsWith("#"));
}
