/**
 * Helper used in exhaustive switch assertions; throws if reached or coerces for test shims.
 *
 * @param value - Value typed as `never` to assert exhaustiveness
 * @returns never (always throws or coerces in test shims)
 */
export default function asNever(value: unknown): never {
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast for malformed module input */
	return value as never;
}
