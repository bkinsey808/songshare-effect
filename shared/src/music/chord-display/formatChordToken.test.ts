import { describe, expect, it } from "vitest";

import formatChordToken from "./formatChordToken";

describe("formatChordToken", () => {
	it("includes the shape code when present", () => {
		// Act
		const result = formatChordToken({
			root: "Bb",
			rootType: "absolute",
			shapeCode: "7",
		});

		// Assert
		expect(result).toBe("[Bb 7]");
	});

	it("omits the trailing space when the shape code is empty", () => {
		// Act
		const result = formatChordToken({
			root: "V",
			rootType: "roman",
			shapeCode: "",
		});

		// Assert
		expect(result).toBe("[V]");
	});
});
