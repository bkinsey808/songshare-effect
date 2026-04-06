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

	it("transforms slash-chord bass notes for display alongside the root", () => {
		// Act
		const result = transformChordTextForDisplay("[C M/E]", {
			chordDisplayMode: "roman",
			songKey: "C",
		});

		// Assert — root becomes I, bass note E becomes III
		expect(result).toBe("[I M/III]");
	});

	it("leaves a slash chord unchanged when the bass note is not a recognised SongKey", () => {
		// Act
		const result = transformChordTextForDisplay("[C M/xyz]", {
			chordDisplayMode: "roman",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("[I M/xyz]");
	});
});
