import { describe, expect, it } from "vitest";

import buildLineKeys from "./buildLineKeys";

const FIRST_LINE = "Verse";
const SECOND_LINE = "Hi";
const THIRD_LINE = "";
const EMPTY_LINES: readonly string[] = [];
const MULTI_LINE_KEYS = ["0", "6", "9"];

describe("buildLineKeys", () => {
	it("returns an empty array when there are no lines", () => {
		// Act
		const result = buildLineKeys(EMPTY_LINES);

		// Assert
		expect(result).toStrictEqual([]);
	});

	it("builds stable offsets across multiple lines", () => {
		// Arrange
		const lines = [FIRST_LINE, SECOND_LINE, THIRD_LINE];

		// Act
		const result = buildLineKeys(lines);

		// Assert
		expect(result).toStrictEqual(MULTI_LINE_KEYS);
	});
});
