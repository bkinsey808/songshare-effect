import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

// Typed alias used by callers so they don't need to repeat the full signature.
export type ResizeSpy = (canvas: HTMLCanvasElement) => void;

// Dynamically import the module under test.  This file lives outside of a
// test so we can freely use the necessary `as unknown as` cast instead of
// sprinkling oxlint-disable comments throughout spec files.
export function spyResizeCanvasToDisplaySize(): Promise<ResizeSpy> {
	// the underlying spyImport helper is now generic, so we can request the
	// precise callback type directly without an unsafe narrowing cast.
	return spyImport<ResizeSpy>("@/react/lib/canvas/resizeCanvasToDisplaySize");
}
