const KEY_START = 0;
const NOT_FOUND = -1;
const NEXT_ARG_OFFSET = 1;

/**
 * Parses `.env`-style `KEY=VALUE` lines from a block of text.
 *
 * Each line is trimmed; blank lines and lines starting with `#` are skipped.
 * Lines without `=` are ignored. The key is everything before the first `=`
 * (trimmed); the value is everything after it (trimmed). Lines with an empty
 * key after trimming are skipped.
 *
 * @param text - Raw text content to parse (e.g. the contents of a `.env` file).
 * @returns A map of key to value for every valid `KEY=VALUE` line found.
 */
export default function parseKeyValueLines(text: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (trimmed !== "" && !trimmed.startsWith("#")) {
			const eqIdx = trimmed.indexOf("=");
			if (eqIdx !== NOT_FOUND) {
				const key = trimmed.slice(KEY_START, eqIdx).trim();
				const value = trimmed.slice(eqIdx + NEXT_ARG_OFFSET).trim();
				if (key !== "") {
					result[key] = value;
				}
			}
		}
	}
	return result;
}
