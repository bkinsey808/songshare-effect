/**
 * Extract a shallow params object from a record used for i18n message
 * interpolation. The input `rec` is expected to contain a reserved `key`
 * property and zero or more other properties which are treated as params.
 *
 * This helper is factored out so it can be unit tested.
 *
 * @param rec - Record that may contain a `key` and additional params.
 * @returns A plain object with all entries from `rec` except `key`.
 */
export default function computeParams(rec: Record<string, unknown>): Record<string, unknown> {
	const params: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(rec)) {
		if (key !== "key") {
			params[key] = val;
		}
	}
	return params;
}
