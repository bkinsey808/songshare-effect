import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import resizeCanvasToDisplaySize from "@/react/canvas/resizeCanvasToDisplaySize";

import useResizeCanvasToDisplaySizeOnWindowResize from "./useResizeCanvasToDisplaySizeOnWindowResize";

vi.mock("@/react/canvas/resizeCanvasToDisplaySize", () => ({
	default: vi.fn(),
}));

const mockResize = vi.mocked(resizeCanvasToDisplaySize);

describe("useResizeCanvasToDisplaySizeOnWindowResize", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("adds resize listener on mount and removes on unmount", () => {
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
	});

	it("calls resizeCanvasToDisplaySize when resize event fires and canvas is present", () => {
		const canvas = document.createElement("canvas");
		const canvasRef = { current: canvas };

		const { unmount } = renderHook(() => {
			useResizeCanvasToDisplaySizeOnWindowResize(canvasRef);
		});

		const resizeEvent = new Event("resize");
		globalThis.dispatchEvent(resizeEvent);

		expect(mockResize).toHaveBeenCalledWith(canvas);

		unmount();
	});

	it("does not call resizeCanvasToDisplaySize if canvas is null", () => {
		const canvasRef = { current: undefined };

		const { unmount } = renderHook(() => {
			useResizeCanvasToDisplaySizeOnWindowResize(canvasRef);
		});

		const resizeEvent = new Event("resize");
		globalThis.dispatchEvent(resizeEvent);

		expect(mockResize).not.toHaveBeenCalled();

		unmount();
	});
});
