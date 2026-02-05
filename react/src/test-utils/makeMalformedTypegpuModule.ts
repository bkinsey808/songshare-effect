/**
 * Create a malformed typegpu module object for negative tests.
 *
 * @returns A malformed module object (narrowed to `never` for test safety)
 */
export default function makeMalformedTypegpuModule(): never {
	// Intentionally assert an invalid shape to trigger error paths in tests.
	// The unsafe assertion is localized here so tests can use a clear helper
	// without littering inline eslint disables.
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only: produce malformed TypeGPU module */
	return { unknown: 123 } as unknown as never;
}
