import { describe, expect, it } from "vitest";

import toUnicodeAccidentals from "@/react/music/intervals/toUnicodeAccidentals";

describe("toUnicodeAccidentals", () => {
	it.each([
		{ name: "returns empty string unchanged", value: "", expected: "" },
		{ name: "replaces b with ♭", value: "bII", expected: "♭II" },
		{ name: "replaces # with ♯", value: "C#", expected: "C♯" },
		{ name: "replaces multiple flats", value: "bII bVII", expected: "♭II ♭VII" },
		{ name: "replaces multiple sharps", value: "C# F#", expected: "C♯ F♯" },
		{
			name: "replaces both flat and sharp in the same string",
			value: "#I bII",
			expected: "♯I ♭II",
		},
		{ name: "passes through strings with no accidentals", value: "Cmaj", expected: "Cmaj" },
	])("$name", ({ value, expected }) => {
		// Act
		const result = toUnicodeAccidentals(value);

		// Assert
		expect(result).toBe(expected);
	});
});
