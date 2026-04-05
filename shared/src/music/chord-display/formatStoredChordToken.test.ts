import { describe, expect, it } from "vitest";

import formatStoredChordToken from "./formatStoredChordToken";

describe("formatStoredChordToken", () => {
	it("stores absolute roots as roman degrees when the song key is known", () => {
		// Act
		const result = formatStoredChordToken({
			root: "G",
			rootType: "absolute",
			shapeCode: "7",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("[V 7]");
	});

	it("stores roman roots as absolute roots when the song key is missing", () => {
		// Act
		const result = formatStoredChordToken({
			root: "bVII",
			rootType: "roman",
			shapeCode: "M7",
			songKey: "",
		});

		// Assert
		expect(result).toBe("[Bb M7]");
	});

	it("keeps absolute roots when the song key is missing", () => {
		// Act
		const result = formatStoredChordToken({
			root: "G",
			rootType: "absolute",
			shapeCode: "7",
			songKey: "",
		});

		// Assert
		expect(result).toBe("[G 7]");
	});
});
