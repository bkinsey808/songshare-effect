import { describe, expect, it } from "vitest";

import findLanguageTokenAtSelection from "./findLanguageTokenAtSelection";

const ENGLISH_TOKEN_TEXT = "{en}";
const SPANISH_TOKEN_TEXT = "{es}";
const SINGLE_LANGUAGE_TEXT = "{en}Hello world";
const MULTI_LANGUAGE_TEXT = "{en}Hello {es}mundo";
const TOKEN_START_INDEX = 0;
const TOKEN_END_INDEX = 4;
const CARET_INSIDE_TOKEN_INDEX = 2;
const CARET_AFTER_FIRST_TOKEN_INDEX = 9;
const CARET_AT_END_OF_SINGLE_LANGUAGE_TEXT = SINGLE_LANGUAGE_TEXT.length;
const CARET_AT_END_OF_MULTI_LANGUAGE_TEXT = MULTI_LANGUAGE_TEXT.length;
const RANGE_START_AFTER_FIRST_TOKEN_INDEX = 5;
const RANGE_END_AFTER_FIRST_TOKEN_INDEX = 10;

describe("findLanguageTokenAtSelection", () => {
	it("finds a language token when the caret is inside it", () => {
		// Arrange
		const params = {
			value: SINGLE_LANGUAGE_TEXT,
			selectionStart: CARET_INSIDE_TOKEN_INDEX,
			selectionEnd: CARET_INSIDE_TOKEN_INDEX,
		};

		// Act
		const result = findLanguageTokenAtSelection(params);

		// Assert
		expect(result).toStrictEqual({
			token: ENGLISH_TOKEN_TEXT,
			tokenStart: TOKEN_START_INDEX,
			tokenEnd: TOKEN_END_INDEX,
			languageCode: "en",
		});
	});

	it("falls back to the nearest earlier language token for a collapsed caret", () => {
		// Arrange
		const params = {
			value: SINGLE_LANGUAGE_TEXT,
			selectionStart: CARET_AFTER_FIRST_TOKEN_INDEX,
			selectionEnd: CARET_AFTER_FIRST_TOKEN_INDEX,
		};

		// Act
		const result = findLanguageTokenAtSelection(params);

		// Assert
		expect(result).toStrictEqual({
			token: ENGLISH_TOKEN_TEXT,
			tokenStart: TOKEN_START_INDEX,
			tokenEnd: TOKEN_END_INDEX,
			languageCode: "en",
		});
	});

	it("uses the nearest earlier token when multiple language markers exist", () => {
		// Arrange
		const params = {
			value: MULTI_LANGUAGE_TEXT,
			selectionStart: CARET_AT_END_OF_MULTI_LANGUAGE_TEXT,
			selectionEnd: CARET_AT_END_OF_MULTI_LANGUAGE_TEXT,
		};

		// Act
		const result = findLanguageTokenAtSelection(params);

		// Assert
		expect(result).toMatchObject({
			token: SPANISH_TOKEN_TEXT,
			languageCode: "es",
		});
	});

	it("does not fall back for a non-collapsed selection that does not overlap a token", () => {
		// Arrange
		const params = {
			value: SINGLE_LANGUAGE_TEXT,
			selectionStart: RANGE_START_AFTER_FIRST_TOKEN_INDEX,
			selectionEnd: RANGE_END_AFTER_FIRST_TOKEN_INDEX,
		};

		// Act
		const result = findLanguageTokenAtSelection(params);

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns the nearest earlier token at the end of the text", () => {
		// Arrange
		const params = {
			value: SINGLE_LANGUAGE_TEXT,
			selectionStart: CARET_AT_END_OF_SINGLE_LANGUAGE_TEXT,
			selectionEnd: CARET_AT_END_OF_SINGLE_LANGUAGE_TEXT,
		};

		// Act
		const result = findLanguageTokenAtSelection(params);

		// Assert
		expect(result).toMatchObject({
			token: ENGLISH_TOKEN_TEXT,
			languageCode: "en",
		});
	});
});
