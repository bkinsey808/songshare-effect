import { describe, expect, it } from "vitest";

import getInitialShapeCode from "./getInitialShapeCode";

describe("getInitialShapeCode", () => {
	it("returns the parsed shape code from the initial token", () => {
		// Arrange
		const initialChordToken = "[bVII sus4]";

		// Act
		const result = getInitialShapeCode({ initialChordToken });

		// Assert
		expect(result).toBe("sus4");
	});

	it("falls back to M when there is no initial token", () => {
		// Arrange
		const initialChordToken = undefined;

		// Act
		const result = getInitialShapeCode({ initialChordToken });

		// Assert
		expect(result).toBe("M");
	});
});
