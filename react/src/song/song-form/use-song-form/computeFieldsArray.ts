/**
 * Extracts and normalizes a fields array from a publication object.
 *
 * @param pub - An optional object that may contain a "fields" property. The fields property
 *              should be an array of strings or numbers.
 * @returns An array of strings. Returns an empty array if:
 *          - `pub` is undefined or null
 *          - `pub.fields` is not an array
 *          - All items in the fields array are filtered out (non-string, non-number values)
 *
 * @remarks
 * - String values are included as-is
 * - Number values are converted to strings
 * - Other types (objects, booleans, etc.) are ignored
 */
export default function computeFieldsArray(pub?: Record<string, unknown>): string[] {
	if (!pub || !Array.isArray(pub["fields"])) {
		return [];
	}
	const out: string[] = [];
	const fields = pub["fields"] as unknown[];
	for (const raw of fields) {
		if (typeof raw === "string") {
			out.push(raw);
		} else if (typeof raw === "number") {
			out.push(String(raw));
		}
	}
	return out;
}
