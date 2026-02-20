/* oxlint-disable @typescript-eslint/no-unsafe-type-assertion */
/**
 * Test helper for forced type casting.
 *
 * Localizing the ESLint disable here keeps test files clean.
 */
export default function forceCast<TValue>(value: unknown): TValue {
	return value as TValue;
}
