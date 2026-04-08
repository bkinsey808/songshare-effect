import { describe, expect, it } from "vitest";

import computeInitialBassNote from "@/react/music/sci/computeInitialBassNote";

const TOKEN_WITHOUT_SLASH = "[C M]";
const TOKEN_SLASH_E = "[C M/E]";
const TOKEN_SLASH_BB = "[C M/Bb]";
const TOKEN_INVALID_BASS = "[C M/X]";
const BASS_NOTE_E = "E";
const BASS_NOTE_BB = "Bb";

describe("computeInitialBassNote", () => {
	it("returns undefined when the initial token is undefined", () => {
		// Act
		const result = computeInitialBassNote({ initialChordToken: undefined });

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns undefined when the token has no slash chord", () => {
		// Act
		const result = computeInitialBassNote({ initialChordToken: TOKEN_WITHOUT_SLASH });

		// Assert
		expect(result).toBeUndefined();
	});

	it("extracts the bass note E from a slash chord token", () => {
		// Act
		const result = computeInitialBassNote({ initialChordToken: TOKEN_SLASH_E });

		// Assert
		expect(result).toBe(BASS_NOTE_E);
	});

	it("extracts the bass note Bb from a slash chord token", () => {
		// Act
		const result = computeInitialBassNote({ initialChordToken: TOKEN_SLASH_BB });

		// Assert
		expect(result).toBe(BASS_NOTE_BB);
	});

	it("returns undefined when the bass note after the slash is not a valid SongKey", () => {
		// Act
		const result = computeInitialBassNote({ initialChordToken: TOKEN_INVALID_BASS });

		// Assert
		expect(result).toBeUndefined();
	});
});
