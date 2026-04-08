import { describe, expect, it } from "vitest";

import computeRootRows from "@/react/music/root-picker/computeRootRows";

const SECOND_ROW_INDEX = 1;

describe("computeRootRows", () => {
	it("returns roman rows with unicode accidental labels", () => {
		// Arrange
		const params = {
			chordDisplayMode: "roman" as const,
			songKey: "C" as const,
		};

		// Act
		const result = computeRootRows(params);

		// Assert
		expect(result[SECOND_ROW_INDEX]).toStrictEqual({
			primary: { root: "#I", rootType: "roman", label: "♯I" },
			secondary: { root: "bII", rootType: "roman", label: "♭II" },
		});
	});

	it("returns absolute rows formatted for the active display mode", () => {
		// Arrange
		const params = {
			chordDisplayMode: "letters" as const,
			songKey: "C" as const,
		};

		// Act
		const result = computeRootRows(params);

		// Assert
		expect(result[SECOND_ROW_INDEX]).toStrictEqual({
			primary: { root: "C#", rootType: "absolute", label: "C♯" },
			secondary: { root: "Db", rootType: "absolute", label: "D♭" },
		});
	});
});
