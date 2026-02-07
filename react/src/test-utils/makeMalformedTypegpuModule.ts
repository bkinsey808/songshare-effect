/**
 * Create a malformed typegpu module object for negative tests.
 *
 * @returns A malformed module object (narrowed to `never` for test safety)
 */
export default function makeMalformedTypegpuModule(): never {
	// Throwing here ensures tests that call this helper will observe an error
	// while keeping the implementation free of unsafe assertions.
	throw new Error("malformed test TypeGPU module");
}
