import { describe, expect, it } from "vitest";

import getDuplicateSlideName from "./getDuplicateSlideName";
import makeSlides from "./test-helpers";
const BASE_SLIDE = "Slide 1";
const SECOND_SLIDE = "Slide 2";
const MY_SLIDE = "My Slide";

describe("getDuplicateSlideName", () => {
	it("returns next sequential Slide N when available", () => {
		const slides = makeSlides([BASE_SLIDE]);
		expect(getDuplicateSlideName(BASE_SLIDE, slides)).toBe(SECOND_SLIDE);
	});

	it("returns (Copy) name when sequential exists", () => {
		const slides = makeSlides([BASE_SLIDE, SECOND_SLIDE]);
		expect(getDuplicateSlideName(BASE_SLIDE, slides)).toBe(`${BASE_SLIDE} (Copy)`);
	});

	it("increments copy index when copies exist", () => {
		const slides = makeSlides([MY_SLIDE, `${MY_SLIDE} (Copy)`, `${MY_SLIDE} (Copy 2)`]);
		expect(getDuplicateSlideName(MY_SLIDE, slides)).toBe(`${MY_SLIDE} (Copy 3)`);
	});
});
