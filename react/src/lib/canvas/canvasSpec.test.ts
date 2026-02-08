import { describe, expect, it } from "vitest";

import renderFrameSpec from "./canvasSpec";

const FRAME = 10;
const FRAME_INCREMENT = 2;
const HUE_MAX = 360;

describe("canvasSpec", () => {
	it("computes fillStyle and text correctly", () => {
		const WIDTH = 100;
		const HEIGHT = 50;
		const TEXT_X = 5;
		const TEXT_Y = 10;

		const spec = renderFrameSpec(FRAME, {
			frameIncrement: FRAME_INCREMENT,
			hueMax: HUE_MAX,
			clearX: 0,
			clearY: 0,
			width: WIDTH,
			height: HEIGHT,
			textX: TEXT_X,
			textY: TEXT_Y,
			hasModule: true,
			font: "12px sans-serif",
		});

		expect(spec.fillStyle).toBe("hsl(20, 60%, 50%)");
		expect(spec.text).toBe("typegpu module found: true");
		expect(spec.font).toBe("12px sans-serif");
		expect(spec.area).toStrictEqual(expect.objectContaining({ width: WIDTH, height: HEIGHT }));
		expect(spec.textPos).toStrictEqual(expect.objectContaining({ left: TEXT_X, top: TEXT_Y }));
	});
});
