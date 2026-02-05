/**
 * Read the slide order array from a public payload and coerce items to strings.
 *
 * @param pub - Optional public payload with `slide_order` field
 * @returns The coerced array of slide ids
 */
export default function computeSlideOrder(pub?: Record<string, unknown>): string[] {
	if (!pub || !Array.isArray(pub["slide_order"])) {
		return [];
	}
	const out: string[] = [];
	const arr = pub["slide_order"] as unknown[];
	for (const item of arr) {
		if (typeof item === "string" || typeof item === "number") {
			out.push(String(item));
		}
	}
	return out;
}
