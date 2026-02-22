import { cleanup, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// helper lives in a non-test file to avoid lint-disable comments
import { spyResizeCanvasToDisplaySize } from "../canvas/test-utils/spyCanvas";
import useResizeCanvasToDisplaySizeOnWindowResize from "./useResizeCanvasToDisplaySizeOnWindowResize";

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

		const mockResize = await spyResizeCanvasToDisplaySize();
		const resizeEvent = new Event("resize");
		globalThis.dispatchEvent(resizeEvent);

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

		const mockResize = await spyResizeCanvasToDisplaySize();
		const resizeEvent = new Event("resize");
		globalThis.dispatchEvent(resizeEvent);

		expect(mockResize).not.toHaveBeenCalled();

		unmount();
		cleanup();
	});
});
