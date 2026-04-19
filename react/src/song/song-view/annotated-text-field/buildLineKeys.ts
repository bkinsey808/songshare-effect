const NEWLINE_CHAR_LENGTH = 1;

/**
 * Build stable React keys for each line based on character offsets in the
 * original text. Offsets are unique per line so keys never collide.
 *
 * @param lines - Array of line strings split from the full text
 * @returns Array of stable key strings, one per line
 */
export default function buildLineKeys(lines: readonly string[]): string[] {
	const keys: string[] = [];
	let offset = 0;
	for (const line of lines) {
		keys.push(String(offset));
		offset += line.length + NEWLINE_CHAR_LENGTH;
	}
	return keys;
}
