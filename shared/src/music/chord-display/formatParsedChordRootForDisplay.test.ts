import { describe, expect, it } from "vitest";

import formatParsedChordRootForDisplay from "./formatParsedChordRootForDisplay";

describe("formatParsedChordRootForDisplay", () => {
	it("formats absolute roots with the requested display mode", () => {
		// Act
		const result = formatParsedChordRootForDisplay({
			token: {
				root: "B",
				rootType: "absolute",
				shapeCode: "-",
			},
			chordDisplayMode: "german",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("H");
	});

	it("resolves roman roots before formatting non-roman displays", () => {
		// Act
		const result = formatParsedChordRootForDisplay({
			token: {
				root: "V",
				rootType: "roman",
				shapeCode: "7",
			},
			chordDisplayMode: "letters",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("G");
	});

	it("keeps the roman root when it cannot resolve an absolute key", () => {
		// Act
		const result = formatParsedChordRootForDisplay({
			token: {
				root: "V",
				rootType: "roman",
				shapeCode: "7",
			},
			chordDisplayMode: "letters",
			songKey: "",
		});

		// Assert
		expect(result).toBe("V");
	});
});
