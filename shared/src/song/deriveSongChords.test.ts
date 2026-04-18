import { describe, expect, it } from "vitest";

import deriveSongChords from "./deriveSongChords";

const INVALID_NON_STRING_CHORD = 42;

describe("deriveSongChords", () => {
	it("returns distinct chord tokens in first-appearance order across slide positions", () => {
		// Arrange
		const slides = {
			"slide-1": {
				slide_name: "Slide 1",
				field_data: {
					lyrics: "One [C -] two [G 7] three [C -]",
				},
			},
			"slide-2": {
				slide_name: "Slide 2",
				field_data: {
					lyrics: "Four [A m] five [C -]",
				},
			},
		};

		// Act
		const result = deriveSongChords({
			slideOrder: ["slide-2", "slide-1", "slide-2"],
			slides,
		});

		// Assert
		expect(result).toStrictEqual(["A m", "C -", "G 7"]);
	});

	it("ignores invalid bracketed text and appends slides missing from slideOrder", () => {
		// Arrange
		const slides = {
			"slide-1": {
				slide_name: "Slide 1",
				field_data: {
					lyrics: "Ignore [not a chord]",
				},
			},
			"slide-2": {
				slide_name: "Slide 2",
				field_data: {
					lyrics: "Keep [F M7]",
				},
			},
		};

		// Act
		const result = deriveSongChords({
			slideOrder: ["slide-1"],
			slides,
		});

		// Assert
		expect(result).toStrictEqual(["F M7"]);
	});

	it("appends existing extra chords after lyric-backed chords while preserving extra order", () => {
		// Arrange
		const slides = {
			"slide-1": {
				slide_name: "Slide 1",
				field_data: {
					lyrics: "One [C -] two [G 7]",
				},
			},
		};

		// Act
		const result = deriveSongChords({
			slideOrder: ["slide-1"],
			slides,
			existingChords: ["F M7", "[C -]", "A m"],
		});

		// Assert
		expect(result).toStrictEqual(["C -", "G 7", "F M7", "A m"]);
	});

	it("ignores invalid or duplicate existing extra chords", () => {
		// Act
		const result = deriveSongChords({
			slideOrder: [],
			slides: {},
			existingChords: ["A m", "[A m]", "[not a chord]", INVALID_NON_STRING_CHORD],
		});

		// Assert
		expect(result).toStrictEqual(["A m"]);
	});
});
