/**
 * Attempt to parse JSON from a string.
 *
 * This helper first trims the input and attempts `JSON.parse` on the full
 * string. If that fails, it tries a best-effort extraction by locating the
 * first `{` and the last `}` and attempting to parse the substring between
 * them. This is useful when a JSON payload is embedded in surrounding text
 * (for example, an error message that contains a JSON blob).
 *
 * Returns the parsed value on success, or `undefined` when no valid JSON
 * can be found.
 *
 * @param str - Input string that may contain JSON
 * @returns The parsed value when valid JSON is found; otherwise `undefined`
 *
 * @example
 * tryParseJsonFromString('  {"a":1}  ') // => { a: 1 }
 * tryParseJsonFromString('error: {"a":1} (see)') // => { a: 1 }
 */
export default function tryParseJsonFromString(str: string): unknown {
	const trimmed = str.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const NOT_FOUND = -1;
		const SLICE_OFFSET = 1;
		const first = trimmed.indexOf("{");
		const last = trimmed.lastIndexOf("}");
		if (first !== NOT_FOUND && last !== NOT_FOUND && last > first) {
			const sub = trimmed.slice(first, last + SLICE_OFFSET);
			try {
				return JSON.parse(sub);
			} catch {
				return undefined;
			}
		}
		return undefined;
	}
}
