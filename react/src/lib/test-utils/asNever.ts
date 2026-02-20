/**
 * Test-only coercion utility
 *
 * Some tests need to coerce an arbitrary value into a `never`-typed slot to
 * exercise failure or malformed-module paths. This is inherently unsafe in
 * TypeScript; keep the single narrow cast localized to this helper and keep
 * calls throughout tests clean and lint-friendly.
 */
export default function asNever(value: unknown): never {
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast for malformed module input */
	return value as never;
}
