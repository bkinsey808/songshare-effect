import { describe, expect, it } from "vitest";

import {
	formatStoredChordToken,
	formatChordToken,
	parseChordTokenBody,
	transformChordTextForDisplay,
} from "./chord-display";

describe("chord-display", () => {
	it("parses canonical bracket token bodies", () => {
		expect(parseChordTokenBody("C -")).toStrictEqual({
			root: "C",
			rootType: "absolute",
			shapeCode: "-",
		});
		expect(parseChordTokenBody("bVII M7")).toStrictEqual({
			root: "bVII",
			rootType: "roman",
			shapeCode: "M7",
		});
		expect(parseChordTokenBody("F# M7")).toStrictEqual({
			root: "F#",
			rootType: "absolute",
			shapeCode: "M7",
		});
	});

	it("formats canonical chord tokens", () => {
		expect(
			formatChordToken({
				root: "Bb",
				rootType: "absolute",
				shapeCode: "7",
			}),
		).toBe("[Bb 7]");
	});

	it("formats stored chord tokens as roman numerals when the song has a key", () => {
		expect(
			formatStoredChordToken({
				root: "G",
				rootType: "absolute",
				shapeCode: "7",
				songKey: "C",
			}),
		).toBe("[V 7]");
	});

	it("formats stored chord tokens as letters when the song has no key", () => {
		expect(
			formatStoredChordToken({
				root: "G",
				rootType: "absolute",
				shapeCode: "7",
				songKey: "",
			}),
		).toBe("[G 7]");
	});

	it("transforms letter chords into solfege display", () => {
		expect(
			transformChordTextForDisplay("Hello [C -] world [Bb 7]", {
				chordDisplayMode: "solfege",
				songKey: "C",
			}),
		).toBe("Hello [Do -] world [Si♭ 7]");
	});

	it("transforms letter chords into german display", () => {
		expect(
			transformChordTextForDisplay("[B -] [Bb 7]", {
				chordDisplayMode: "german",
				songKey: "C",
			}),
		).toBe("[H -] [B 7]");
	});

	it("transforms letter chords into roman numerals relative to song key", () => {
		expect(
			transformChordTextForDisplay("[C -] [G 7] [Bb M7]", {
				chordDisplayMode: "roman",
				songKey: "C",
			}),
		).toBe("[I -] [V 7] [bVII M7]");
	});

	it("transforms roman-stored chords into letter display relative to song key", () => {
		expect(
			transformChordTextForDisplay("[I -] [V 7] [bVII M7]", {
				chordDisplayMode: "letters",
				songKey: "C",
			}),
		).toBe("[C -] [G 7] [B♭ M7]");
	});

	it("falls back to letters when roman mode has no song key", () => {
		expect(
			transformChordTextForDisplay("[C# -]", {
				chordDisplayMode: "roman",
				songKey: "",
			}),
		).toBe("[C♯ -]");
	});
});
