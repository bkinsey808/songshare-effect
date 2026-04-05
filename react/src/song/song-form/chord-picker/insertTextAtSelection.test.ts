import { describe, expect, it } from "vitest";

import insertTextAtSelection from "./insertTextAtSelection";

const HELLO_WORLD = "Hello world";
const CHORD_INSERTION = "[C -]";
const HELLO_PREFIX = "Hello ";
const WORLD_SUFFIX = "world";
const REPLACEMENT_SOURCE = "Hello friend";
const REPLACEMENT_TEXT = "world";
const INSERTED_CARET_AT_END = 11;
const INSERT_AT_INDEX_SIX = 6;
const REPLACE_START_INDEX = 6;
const REPLACE_END_INDEX = 12;

describe("insertTextAtSelection", () => {
	it("inserts text at the provided collapsed caret position", () => {
		// Arrange
		const params = {
			value: HELLO_WORLD,
			insertion: CHORD_INSERTION,
			selectionStart: INSERT_AT_INDEX_SIX,
			selectionEnd: INSERT_AT_INDEX_SIX,
		};

		// Act
		const result = insertTextAtSelection(params);

		// Assert
		expect(result).toStrictEqual({
			nextValue: `${HELLO_PREFIX}${CHORD_INSERTION}${WORLD_SUFFIX}`,
			nextSelectionStart: INSERT_AT_INDEX_SIX + CHORD_INSERTION.length,
		});
	});

	it("replaces the selected text range before moving the caret to the end of the insertion", () => {
		// Arrange
		const params = {
			value: REPLACEMENT_SOURCE,
			insertion: REPLACEMENT_TEXT,
			selectionStart: REPLACE_START_INDEX,
			selectionEnd: REPLACE_END_INDEX,
		};

		// Act
		const result = insertTextAtSelection(params);

		// Assert
		expect(result).toStrictEqual({
			nextValue: HELLO_WORLD,
			nextSelectionStart: INSERTED_CARET_AT_END,
		});
	});

	it("appends at the end of the value when no selection offsets are provided", () => {
		// Arrange
		const params = {
			value: HELLO_PREFIX,
			insertion: CHORD_INSERTION,
		};

		// Act
		const result = insertTextAtSelection(params);

		// Assert
		expect(result).toStrictEqual({
			nextValue: `${HELLO_PREFIX}${CHORD_INSERTION}`,
			nextSelectionStart: HELLO_PREFIX.length + CHORD_INSERTION.length,
		});
	});
});
