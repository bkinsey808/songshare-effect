import { describe, expect, it } from "vitest";

import findCurrentChordTokenAtSelection from "./findCurrentChordTokenAtSelection";

const FIRST_CHORD = "[C -]";
const SECOND_CHORD = "[G 7]";
const CHORD_TEXT = `Hello ${FIRST_CHORD} world ${SECOND_CHORD}`;
const CARET_INSIDE_FIRST_CHORD = 8;
const CARET_AFTER_FIRST_CHORD = 14;
const CARET_AT_END = CHORD_TEXT.length;
const RANGE_WITHOUT_CHORD_START = 13;
const RANGE_WITHOUT_CHORD_END = 18;

describe("findCurrentChordTokenAtSelection", () => {
	it("returns the chord under a collapsed caret", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: CARET_INSIDE_FIRST_CHORD,
			selectionEnd: CARET_INSIDE_FIRST_CHORD,
		};

		// Act
		const result = findCurrentChordTokenAtSelection(params);

		// Assert
		expect(result).toMatchObject({
			token: FIRST_CHORD,
			parsedToken: {
				root: "C",
				rootType: "absolute",
				shapeCode: "-",
			},
		});
	});

	it("falls back to the nearest earlier chord when the caret is between chords", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: CARET_AFTER_FIRST_CHORD,
			selectionEnd: CARET_AFTER_FIRST_CHORD,
		};

		// Act
		const result = findCurrentChordTokenAtSelection(params);

		// Assert
		expect(result).toMatchObject({
			token: FIRST_CHORD,
		});
	});

	it("uses the nearest earlier chord at the end of the lyrics", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: CARET_AT_END,
			selectionEnd: CARET_AT_END,
		};

		// Act
		const result = findCurrentChordTokenAtSelection(params);

		// Assert
		expect(result).toMatchObject({
			token: SECOND_CHORD,
		});
	});

	it("does not fall back for a non-collapsed selection with no overlapping chord", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: RANGE_WITHOUT_CHORD_START,
			selectionEnd: RANGE_WITHOUT_CHORD_END,
		};

		// Act
		const result = findCurrentChordTokenAtSelection(params);

		// Assert
		expect(result).toBeUndefined();
	});
});
