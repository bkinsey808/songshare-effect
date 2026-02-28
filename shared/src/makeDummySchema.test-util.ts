import { type Schema } from "effect";

/**
 * Return a dummy schema for typing in tests.  The cast is intentionally
 * unsafe; the disable comment keeps the warning out of test files.
 */
export default function makeDummySchema<TValue>(): Schema.Schema<TValue> {
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
	return {} as unknown as Schema.Schema<TValue>;
}
