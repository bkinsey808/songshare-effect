import { describe, expect, it } from "vitest";

import computeSlides from "./computeSlides";

const INVALID_PUB: Record<string, unknown> = {};

describe("computeSlides", () => {
	it("returns empty object when pub missing or malformed", () => {
		expect(computeSlides(undefined)).toStrictEqual({});
		expect(computeSlides(INVALID_PUB)).toStrictEqual({});
		expect(computeSlides({ slides: "not-an-object" })).toStrictEqual({});
	});

	it("builds slides record only for valid slides", () => {
		const MOCK_SLIDES = {
			one: { slide_name: "Slide 1", field_data: { lyrics: "foo", bad: 1 } },
			two: { slide_name: "Slide 2", field_data: { lyrics: "bar" } },
			three: "not-an-object",
			four: { slide_name: 123 },
		};

		const EXPECTED_SLIDES = {
			one: {
				slide_name: MOCK_SLIDES.one.slide_name,
				field_data: { lyrics: MOCK_SLIDES.one.field_data.lyrics },
			},
			two: {
				slide_name: MOCK_SLIDES.two.slide_name,
				field_data: { lyrics: MOCK_SLIDES.two.field_data.lyrics },
			},
		};

		const input = { slides: MOCK_SLIDES };

		const out = computeSlides(input);
		expect(Object.keys(out)).toStrictEqual(Object.keys(EXPECTED_SLIDES));
		expect(out).toStrictEqual(EXPECTED_SLIDES);
	});
});
