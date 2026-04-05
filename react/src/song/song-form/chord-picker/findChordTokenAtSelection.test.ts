import { describe, expect, it } from "vitest";

import findChordTokenAtSelection from "./findChordTokenAtSelection";

const CHORD_TEXT = "Hello [C -] world";
const CHORD_TOKEN_START = 6;
const CHORD_TOKEN_END = 11;
const CARET_INSIDE_CHORD = 8;
const CARET_AT_TOKEN_START = 6;
const CARET_AFTER_TOKEN = 11;
const OVERLAP_SELECTION_START = 4;
const OVERLAP_SELECTION_END = 9;
const FIRST_TOKEN_TEXT = "[C -]";
const SECOND_TOKEN_TEXT = "[G 7]";
const MULTI_CHORD_TEXT = "Start [C -] middle [G 7] end";
const SECOND_TOKEN_CARET = 21;

describe("findChordTokenAtSelection", () => {
	it("finds a chord when the caret is inside it", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: CARET_INSIDE_CHORD,
			selectionEnd: CARET_INSIDE_CHORD,
		};

		// Act
		expect(findChordTokenAtSelection(params)).toMatchObject({
			token: FIRST_TOKEN_TEXT,
			tokenStart: CHORD_TOKEN_START,
			tokenEnd: CHORD_TOKEN_END,
			parsedToken: {
				root: "C",
				rootType: "absolute",
				shapeCode: "-",
			},
		});
	});

	it("finds a chord when the caret is just before it", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: CARET_AT_TOKEN_START,
			selectionEnd: CARET_AT_TOKEN_START,
		};

		// Act
		expect(findChordTokenAtSelection(params)).toMatchObject({
			token: FIRST_TOKEN_TEXT,
			tokenStart: CHORD_TOKEN_START,
		});
	});

	it("finds a chord when the selection overlaps it", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: OVERLAP_SELECTION_START,
			selectionEnd: OVERLAP_SELECTION_END,
		};

		// Act
		expect(findChordTokenAtSelection(params)).toMatchObject({
			token: FIRST_TOKEN_TEXT,
			tokenStart: CHORD_TOKEN_START,
		});
	});

	it("ignores the caret when it is just after the chord", () => {
		// Arrange
		const params = {
			value: CHORD_TEXT,
			selectionStart: CARET_AFTER_TOKEN,
			selectionEnd: CARET_AFTER_TOKEN,
		};

		// Act
		const result = findChordTokenAtSelection(params);

		// Assert
		expect(result).toBeUndefined();
	});

	it("ignores bracketed text that is not a valid chord token", () => {
		// Arrange
		const params = {
			value: "Hello [not a chord] world",
			selectionStart: CARET_INSIDE_CHORD,
			selectionEnd: CARET_INSIDE_CHORD,
		};

		// Act
		const result = findChordTokenAtSelection(params);

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns undefined when either selection boundary is missing", () => {
		// Arrange
		const missingStart = {
			value: CHORD_TEXT,
			selectionStart: undefined,
			selectionEnd: CARET_INSIDE_CHORD,
		};
		const missingEnd = {
			value: CHORD_TEXT,
			selectionStart: CARET_INSIDE_CHORD,
			selectionEnd: undefined,
		};

		// Act
		const result = {
			missingEnd: findChordTokenAtSelection(missingEnd),
			missingStart: findChordTokenAtSelection(missingStart),
		};

		// Assert
		expect(result).toStrictEqual({
			missingEnd: undefined,
			missingStart: undefined,
		});
	});

	it("finds the later chord when the caret is inside a later token", () => {
		// Arrange
		const params = {
			value: MULTI_CHORD_TEXT,
			selectionStart: SECOND_TOKEN_CARET,
			selectionEnd: SECOND_TOKEN_CARET,
		};

		// Act
		const result = findChordTokenAtSelection(params);

		// Assert
		expect(result).toMatchObject({
			token: SECOND_TOKEN_TEXT,
			parsedToken: {
				root: "G",
				rootType: "absolute",
				shapeCode: "7",
			},
		});
	});
});
