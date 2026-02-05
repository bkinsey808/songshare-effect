/**
 * Narrow an unknown value to a `GPUCanvasContext` for test fixtures.
 *
 * @param obj - Value to coerce into a GPUCanvasContext
 * @returns A `GPUCanvasContext` (unsafe test-only cast)
 */
export default function asGpuCanvasContext(obj: unknown): GPUCanvasContext {
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion -- test-only narrow cast for mock WebGPU context */
	return obj as unknown as GPUCanvasContext;
}
