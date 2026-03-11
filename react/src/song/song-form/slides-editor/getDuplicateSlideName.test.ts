import { describe, expect, it } from "vitest";

import getDuplicateSlideName from "./getDuplicateSlideName";

const SLIDE_1 = { slide_name: "Slide 1", field_data: {} };
const SLIDE_2 = { slide_name: "Slide 2", field_data: {} };
const SLIDE_3 = { slide_name: "Slide 3", field_data: {} };

describe("getDuplicateSlideName", () => {
	it("returns Slide N+1 when original is Slide N and N+1 does not exist", () => {
		const slides = { s1: SLIDE_1, s2: SLIDE_2 };
		expect(getDuplicateSlideName("Slide 2", slides)).toBe("Slide 3");
	});

	it("returns Slide N (Copy) when Slide N+1 already exists", () => {
		const slides = { s1: SLIDE_1, s2: SLIDE_2, s3: SLIDE_3 };
		expect(getDuplicateSlideName("Slide 2", slides)).toBe("Slide 2 (Copy)");
	});

	it("returns (Copy 2) when (Copy) already exists", () => {
		const slides = {
			s1: { slide_name: "Custom", field_data: {} },
			s2: { slide_name: "Custom (Copy)", field_data: {} },
		};
		expect(getDuplicateSlideName("Custom", slides)).toBe("Custom (Copy 2)");
	});

	it("returns (Copy 3) when (Copy) and (Copy 2) exist", () => {
		const slides = {
			s1: { slide_name: "X", field_data: {} },
			s2: { slide_name: "X (Copy)", field_data: {} },
			s3: { slide_name: "X (Copy 2)", field_data: {} },
		};
		expect(getDuplicateSlideName("X", slides)).toBe("X (Copy 3)");
	});

	it("returns Slide N+1 for Slide 1 when Slide 2 is free", () => {
		const slides = { s1: SLIDE_1 };
		expect(getDuplicateSlideName("Slide 1", slides)).toBe("Slide 2");
	});

	it("returns (Copy) for non-Slide N pattern names", () => {
		const slides = { s1: { slide_name: "Intro", field_data: {} } };
		expect(getDuplicateSlideName("Intro", slides)).toBe("Intro (Copy)");
	});
});
