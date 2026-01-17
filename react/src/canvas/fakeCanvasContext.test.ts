import { it, expect } from "vitest";

import attachFakeCanvas2DContext from "./fakeCanvasContext";

it("attaches getContext and returns partial 2D context", () => {
	const canvas = document.createElement("canvas");
	attachFakeCanvas2DContext(canvas);
	const ctx = canvas.getContext("2d");
	expect(ctx).not.toBeNull();
	expect(typeof ctx?.clearRect).toBe("function");
	// sanity call
	const ZERO = 0;
	const DIM = 10;
	ctx?.clearRect(ZERO, ZERO, DIM, DIM);
});
