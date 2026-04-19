import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

// Typed alias used by callers so they don't need to repeat the full signature.
export type ResizeSpy = (canvas: HTMLCanvasElement) => void;

/**
 * Create a spy handle for the `resizeCanvasToDisplaySize` module export.
 *
 * This helper lives outside test files so callers do not need repeated
 * inline disable comments for the localized casting inside the spy helper.
 *
 * @returns A promise that resolves to the imported resize spy.
 */
export function spyResizeCanvasToDisplaySize(): Promise<ResizeSpy> {
	// the underlying spyImport helper is now generic, so we can request the
	// precise callback type directly without an unsafe narrowing cast.
	return spyImport<ResizeSpy>("@/react/lib/canvas/resizeCanvasToDisplaySize");
}
