/**
 * Compute the environment variable value portion of a normalized env line.
 * Slices the RHS after the equals sign, trims whitespace, and removes
 * matching surrounding single or double quotes.
 *
 * @param normalized - Trimmed env assignment line without any `export` prefix.
 * @param equalsIndex - Index of the equals sign separating key and value.
 * @returns Parsed environment variable value with matching wrapper quotes removed.
 */
export default function computeEnvValue(normalized: string, equalsIndex: number): string {
	const SLICE_OFFSET = 1;

	let value = normalized.slice(equalsIndex + SLICE_OFFSET).trim();
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		value = value.slice(SLICE_OFFSET, value.length - SLICE_OFFSET);
	}

	return value;
}
