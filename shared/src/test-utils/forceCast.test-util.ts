/**
 * Test helper for forced type casting.
 *
 * Use when tests need to pass mock data that does not fully match the expected
 * type (e.g. ParseError-shaped objects for extractI18nMessages).
 *
 * @param value - arbitrary value to coerce
 * @returns the value coerced to the requested type
 */
export default function forceCast<TValue>(value: unknown): TValue {
	// oxlint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-type-assertion -- test helper for mock data
	return value as any as TValue;
}
