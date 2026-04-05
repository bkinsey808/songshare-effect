import { describe, expect, it } from "vitest";

import parseChordTokenBody from "./parseChordTokenBody";

describe("parseChordTokenBody", () => {
	it("parses trimmed absolute chord tokens", () => {
		// Act
		const result = parseChordTokenBody("  F#   M7  ");

		// Assert
		expect(result).toStrictEqual({
			root: "F#",
			rootType: "absolute",
			shapeCode: "M7",
		});
	});

	it("parses roman chord tokens", () => {
		// Act
		const result = parseChordTokenBody("bVII sus");

		// Assert
		expect(result).toStrictEqual({
			root: "bVII",
			rootType: "roman",
			shapeCode: "sus",
		});
	});

	it("returns undefined for unrecognized roots", () => {
		// Act
		const result = parseChordTokenBody("H dim");

		// Assert
		expect(result).toBeUndefined();
	});
});
