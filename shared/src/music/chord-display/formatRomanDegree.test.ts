import { describe, expect, it } from "vitest";

import formatRomanDegree from "./formatRomanDegree";

describe("formatRomanDegree", () => {
	it("converts an absolute root relative to the song key", () => {
		// Act
		const result = formatRomanDegree("G", "C");

		// Assert
		expect(result).toBe("V");
	});

	it("uses C as the neutral tonic when the song key is missing", () => {
		// Act
		const result = formatRomanDegree("A", "");

		// Assert
		expect(result).toBe("VI");
	});
});
