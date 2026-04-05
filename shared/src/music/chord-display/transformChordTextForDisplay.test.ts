import { describe, expect, it } from "vitest";

import transformChordTextForDisplay from "./transformChordTextForDisplay";

describe("transformChordTextForDisplay", () => {
	it("transforms chord text into the requested display mode", () => {
		// Act
		const result = transformChordTextForDisplay("Hello [C -] world [Bb 7]", {
			chordDisplayMode: "solfege",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("Hello [Do -] world [Si♭ 7]");
	});

	it("leaves unparseable chord tokens unchanged", () => {
		// Act
		const result = transformChordTextForDisplay("[H dim]", {
			chordDisplayMode: "letters",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("[H dim]");
	});

	it("returns plain text unchanged when no chord tokens are present", () => {
		const plainText = "No chords here";

		// Act
		const result = transformChordTextForDisplay(plainText, {
			chordDisplayMode: "roman",
			songKey: "C",
		});

		// Assert
		expect(result).toBe(plainText);
	});
});
