import { cleanup, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import useResizeCanvasToDisplaySizeOnWindowResize from "./useResizeCanvasToDisplaySizeOnWindowResize";

// Async spy helper for `resizeCanvasToDisplaySize`
function spyResizeCanvasToDisplaySize(): Promise<ReturnType<typeof vi.spyOn>> {
	return spyImport("@/react/lib/canvas/resizeCanvasToDisplaySize");
}

describe("useResizeCanvasToDisplaySizeOnWindowResize", () => {
	function setup(): () => void {
		vi.resetAllMocks();
		return () => {
			cleanup();
		};
	}

	it("adds resize listener on mount and removes on unmount", () => {
		const cleanup = setup();
		const addEventListener = vi.spyOn(globalThis, "addEventListener");
		const removeEventListener = vi.spyOn(globalThis, "removeEventListener");

		const canvasRef = { current: undefined };
		const { unmount } = renderHook(() => {
			useResizeCanvasToDisplaySizeOnWindowResize(canvasRef);
		});

		expect(addEventListener).toHaveBeenCalledWith("resize", expect.any(Function), {
			passive: true,
		});

		unmount();

		expect(removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

		addEventListener.mockRestore();
		removeEventListener.mockRestore();
		cleanup();
	});

	it("calls resizeCanvasToDisplaySize when resize event fires and canvas is present", async () => {
		const cleanup = setup();
		const canvas = document.createElement("canvas");
		const canvasRef = { current: canvas };

		const { unmount } = renderHook(() => {
			useResizeCanvasToDisplaySizeOnWindowResize(canvasRef);
		});

		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const mockResize = await spyResizeCanvasToDisplaySize();
		const resizeEvent = new Event("resize");
		globalThis.dispatchEvent(resizeEvent);

		// oxlint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		expect(mockResize).toHaveBeenCalledWith(canvas);

		unmount();
		cleanup();
	});

	it("does not call resizeCanvasToDisplaySize if canvas is null", async () => {
		const cleanup = setup();
		const canvasRef = { current: undefined };

		const { unmount } = renderHook(() => {
			useResizeCanvasToDisplaySizeOnWindowResize(canvasRef);
		});

		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const mockResize = await spyResizeCanvasToDisplaySize();
		const resizeEvent = new Event("resize");
		globalThis.dispatchEvent(resizeEvent);

		// oxlint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		expect(mockResize).not.toHaveBeenCalled();

		unmount();
		cleanup();
	});
});
