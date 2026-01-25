/**
 * Build a synthetic slides record for tests.
 *
 * Produces a Record where keys are sequential strings starting at "1" and values
 * are objects containing a `slide_name` and an empty `field_data` object.
 *
 * @param names - List of slide names to include in the generated record
 * @returns A slides record used by slide-related unit tests
 */
export default function makeSlides(
	names: readonly string[],
): Record<string, { slide_name: string; field_data: Record<string, string> }> {
	const INDEX_OFFSET = 1;
	return Object.fromEntries(
		names.map((nameValue, index) => [
			String(index + INDEX_OFFSET),
			{ slide_name: nameValue, field_data: {} },
		]),
	) as Record<string, { slide_name: string; field_data: Record<string, string> }>;
}
