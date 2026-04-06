import { describe, expect, it } from "vitest";

import getCanonicalToken from "./getCanonicalToken";

describe("getCanonicalToken", () => {
	it("returns an absolute-root canonical token", () => {
		// Arrange
		const params = {
			selectedRoot: {
				root: "Bb" as const,
				rootType: "absolute" as const,
				label: "Bb",
			},
			selectedShapeCode: "-",
			songKey: "C" as const,
		};

		// Act
		const result = getCanonicalToken(params);

		// Assert
		expect(result).toBe("[bVII -]");
	});

	it("returns a roman-root canonical token", () => {
		// Arrange
		const params = {
			selectedRoot: {
				root: "bIII" as const,
				rootType: "roman" as const,
				label: "bIII",
			},
			selectedShapeCode: "ROng",
			songKey: "C" as const,
		};

		// Act
		const result = getCanonicalToken(params);

		// Assert
		expect(result).toBe("[bIII ROng]");
	});

	it("returns undefined when the shape code is missing", () => {
		// Arrange
		const params = {
			selectedRoot: {
				root: "C" as const,
				rootType: "absolute" as const,
				label: "C",
			},
			selectedShapeCode: undefined,
			songKey: "C" as const,
		};

		// Act
		const result = getCanonicalToken(params);

		// Assert
		expect(result).toBeUndefined();
	});
});
