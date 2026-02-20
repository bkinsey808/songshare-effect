/**
 * Create a minimal `GPUCanvasContext` mock by merging provided partials with
 * a safe default. This avoids an unsafe cast and keeps tests explicit about
 * the shape needed by the code under test.
 *
 * @param obj - Partial pieces of the mocked context
 * @returns A `GPUCanvasContext` suitable for use in tests
 */
export default function asGpuCanvasContext(obj: unknown): GPUCanvasContext {
	// Merge caller-provided partials with our defaults and keep the single
	// unsafe assertion localized here so tests do not repeat inline disables.
	const base: Partial<GPUCanvasContext> = {
		configure: (_configuration: GPUCanvasConfiguration): undefined => undefined,
	};
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- merging unknown test input into mock
	const merged = { ...base, ...(obj as object) };
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast for mock WebGPU context
	return merged as unknown as GPUCanvasContext;
}
