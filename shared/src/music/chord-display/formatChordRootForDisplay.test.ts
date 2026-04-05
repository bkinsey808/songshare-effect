import { describe, expect, it } from "vitest";

import formatChordRootForDisplay from "./formatChordRootForDisplay";

describe("formatChordRootForDisplay", () => {
	it("formats standard display modes from the lookup table", () => {
		// Act
		const result = formatChordRootForDisplay({
			root: "B",
			chordDisplayMode: "german",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("H");
	});

	it("formats roman display relative to the song key", () => {
		// Act
		const result = formatChordRootForDisplay({
			root: "G",
			chordDisplayMode: "roman",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("V");
	});
});
