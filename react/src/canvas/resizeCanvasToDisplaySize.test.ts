import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import resizeCanvasToDisplaySize from "./resizeCanvasToDisplaySize";

describe("resizeCanvasToDisplaySize", () => {
	let canvas = document.createElement("canvas");
	const CANVAS_WIDTH = 100;
	const CANVAS_HEIGHT = 200;
	const DPR_2 = 2;
	const DPR_1 = 1;
	const MIN_PIXEL_SIZE = 1;
	const EXPECTED_WIDTH_DPR_2 = 200;
	const EXPECTED_HEIGHT_DPR_2 = 400;
	const ZERO = 0;

	beforeEach(() => {
		canvas = document.createElement("canvas");
		vi.stubGlobal("devicePixelRatio", DPR_1);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("resizes canvas width and height to match bounding rect on dpr 1", () => {
		vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
			new DOMRect(ZERO, ZERO, CANVAS_WIDTH, CANVAS_HEIGHT),
		);

		resizeCanvasToDisplaySize(canvas);

		expect(canvas.width).toBe(CANVAS_WIDTH);
		expect(canvas.height).toBe(CANVAS_HEIGHT);
	});

	it("factors in devicePixelRatio when resizing", () => {
		vi.stubGlobal("devicePixelRatio", DPR_2);
		vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
			new DOMRect(ZERO, ZERO, CANVAS_WIDTH, CANVAS_HEIGHT),
		);

		resizeCanvasToDisplaySize(canvas);

		expect(canvas.width).toBe(EXPECTED_WIDTH_DPR_2);
		expect(canvas.height).toBe(EXPECTED_HEIGHT_DPR_2);
	});

	it("does not update size if it already matches", () => {
		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;

		vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
			new DOMRect(ZERO, ZERO, CANVAS_WIDTH, CANVAS_HEIGHT),
		);

		const widthSpy = vi.spyOn(canvas, "width", "set");
		const heightSpy = vi.spyOn(canvas, "height", "set");

		resizeCanvasToDisplaySize(canvas);

		expect(widthSpy).not.toHaveBeenCalled();
		expect(heightSpy).not.toHaveBeenCalled();
	});

	it("clamps values to MIN_PIXEL_SIZE (1)", () => {
		const MINUS_TEN = -10;
		vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
			new DOMRect(ZERO, ZERO, ZERO, MINUS_TEN),
		);

		resizeCanvasToDisplaySize(canvas);

		expect(canvas.width).toBe(MIN_PIXEL_SIZE);
		expect(canvas.height).toBe(MIN_PIXEL_SIZE);
	});

	it("uses MIN_DPR (1) if devicePixelRatio is undefined", () => {
		const originalDpr = globalThis.devicePixelRatio;
		delete (globalThis as { devicePixelRatio?: number }).devicePixelRatio;

		vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
			new DOMRect(ZERO, ZERO, CANVAS_WIDTH, CANVAS_HEIGHT),
		);

		resizeCanvasToDisplaySize(canvas);

		expect(canvas.width).toBe(CANVAS_WIDTH);
		expect(canvas.height).toBe(CANVAS_HEIGHT);

		// Restore
		globalThis.devicePixelRatio = originalDpr;
	});
});
