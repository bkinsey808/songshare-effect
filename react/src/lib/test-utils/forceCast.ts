/**
 * Test helper for forced type casting.
 *
 * We intentionally perform a two-step cast (via `any`) so that TypeScript
 * doesn't complain when the target type is narrower than the source. This
 * keeps callers free of `as unknown` or `// @ts-ignore` hacks while still
 * making their intent explicit.
 *
 * @param value - arbitrary value to coerce
 * @returns the value coerced to the requested type
 */
export default function forceCast<TValue>(value: unknown): TValue {
	// `any` acts as a bridge that disables narrowing checks. The eslint disable
	// above remains necessary to suppress the linter rule complaining about
	// unsafe assertions.
	// oxlint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-type-assertion
	return value as any as TValue;
}
