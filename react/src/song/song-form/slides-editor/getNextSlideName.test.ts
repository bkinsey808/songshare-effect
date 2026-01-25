import { describe, expect, it } from "vitest";

import getNextSlideName from "./getNextSlideName";
import makeSlides from "./test-helpers";

describe("getNextSlideName", () => {
	const START_COUNT = 2;

	it("returns Slide N+1 when no collision", () => {
		const slides = makeSlides(["Slide 1", "Slide 2"]);
		expect(getNextSlideName(slides, START_COUNT)).toBe("Slide 3");
	});

	it("skips existing names and finds next available", () => {
		const slides = makeSlides(["Slide 3", "Slide 4", "Slide 5"]);
		expect(getNextSlideName(slides, START_COUNT)).toBe("Slide 6");
	});
});
