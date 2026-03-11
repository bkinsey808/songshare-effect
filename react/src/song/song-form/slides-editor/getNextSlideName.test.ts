import { describe, expect, it } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import getNextSlideName from "./getNextSlideName";

const SLIDE_1 = { slide_name: "Slide 1", field_data: {} };
const SLIDE_2 = { slide_name: "Slide 2", field_data: {} };
const ORDER_LEN_TWO = 2;
const ORDER_LEN_THREE = 3;
const ORDER_LEN_FOUR = 4;

describe("getNextSlideName", () => {
	it("returns Slide N+1 when slideOrderLength is N and no conflict", () => {
		const slides = { s1: SLIDE_1, s2: SLIDE_2 };
		expect(getNextSlideName(slides, ORDER_LEN_TWO)).toBe("Slide 3");
	});

	it("returns Slide 1 when slideOrderLength is zero and slides empty", () => {
		expect(getNextSlideName({}, ZERO)).toBe("Slide 1");
	});

	it("skips to next when name already exists", () => {
		const slides = {
			s1: SLIDE_1,
			s2: SLIDE_2,
			s3: { slide_name: "Slide 3", field_data: {} },
		};
		expect(getNextSlideName(slides, ORDER_LEN_THREE)).toBe("Slide 4");
	});

	it("finds first available when several are taken", () => {
		const slides = {
			s1: { slide_name: "Slide 1", field_data: {} },
			s2: { slide_name: "Slide 2", field_data: {} },
			s3: { slide_name: "Slide 3", field_data: {} },
			s4: { slide_name: "Slide 4", field_data: {} },
		};
		expect(getNextSlideName(slides, ORDER_LEN_FOUR)).toBe("Slide 5");
	});
});
