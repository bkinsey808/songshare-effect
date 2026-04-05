import { describe, expect, it } from "vitest";

import parseInitialChordToken from "./parseInitialChordToken";

describe("parseInitialChordToken", () => {
	it("returns undefined when there is no initial chord token", () => {
		// Arrange
		const initialChordToken = undefined;

		// Act
		const result = parseInitialChordToken(initialChordToken);

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns undefined when the token is missing brackets", () => {
		// Arrange
		const initialChordToken = "A M";

		// Act
		const result = parseInitialChordToken(initialChordToken);

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns undefined when the bracketed token body is invalid", () => {
		// Arrange
		const initialChordToken = "[not-a-root M]";

		// Act
		const result = parseInitialChordToken(initialChordToken);

		// Assert
		expect(result).toBeUndefined();
	});

	it("parses absolute-root chord tokens", () => {
		// Arrange
		const initialChordToken = "[Bb sus4]";

		// Act
		const result = parseInitialChordToken(initialChordToken);

		// Assert
		expect(result).toStrictEqual({
			root: "Bb",
			rootType: "absolute",
			shapeCode: "sus4",
		});
	});

	it("parses roman-root chord tokens", () => {
		// Arrange
		const initialChordToken = "[bVII d7]";

		// Act
		const result = parseInitialChordToken(initialChordToken);

		// Assert
		expect(result).toStrictEqual({
			root: "bVII",
			rootType: "roman",
			shapeCode: "d7",
		});
	});
});
