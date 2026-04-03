import { describe, expect, it } from "vitest";

import findChordTokenAtSelection from "./findChordTokenAtSelection";

describe("findChordTokenAtSelection", () => {
	it("finds a chord when the caret is inside it", () => {
		expect(
			findChordTokenAtSelection({
				value: "Hello [C -] world",
				selectionStart: 8,
				selectionEnd: 8,
			}),
		).toMatchObject({
			token: "[C -]",
			tokenStart: 6,
			tokenEnd: 11,
			parsedToken: {
				root: "C",
				rootType: "absolute",
				shapeCode: "-",
			},
		});
	});

	it("finds a chord when the caret is just before it", () => {
		expect(
			findChordTokenAtSelection({
				value: "Hello [C -] world",
				selectionStart: 6,
				selectionEnd: 6,
			}),
		).toMatchObject({
			token: "[C -]",
			tokenStart: 6,
		});
	});

	it("finds a chord when the selection overlaps it", () => {
		expect(
			findChordTokenAtSelection({
				value: "Hello [C -] world",
				selectionStart: 4,
				selectionEnd: 9,
			}),
		).toMatchObject({
			token: "[C -]",
			tokenStart: 6,
		});
	});

	it("ignores the caret when it is just after the chord", () => {
		expect(
			findChordTokenAtSelection({
				value: "Hello [C -] world",
				selectionStart: 11,
				selectionEnd: 11,
			}),
		).toBeUndefined();
	});

	it("ignores bracketed text that is not a valid chord token", () => {
		expect(
			findChordTokenAtSelection({
				value: "Hello [not a chord] world",
				selectionStart: 8,
				selectionEnd: 8,
			}),
		).toBeUndefined();
	});
});
