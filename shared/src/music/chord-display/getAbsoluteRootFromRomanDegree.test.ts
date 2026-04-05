import { describe, expect, it } from "vitest";

import getAbsoluteRootFromRomanDegree from "./getAbsoluteRootFromRomanDegree";

describe("getAbsoluteRootFromRomanDegree", () => {
	it("resolves roman roots relative to the song key", () => {
		// Act
		const result = getAbsoluteRootFromRomanDegree("bVII", "D");

		// Assert
		expect(result).toBe("C");
	});

	it("returns undefined when there is no song key", () => {
		// Act
		const result = getAbsoluteRootFromRomanDegree("V", "");

		// Assert
		expect(result).toBeUndefined();
	});
});
