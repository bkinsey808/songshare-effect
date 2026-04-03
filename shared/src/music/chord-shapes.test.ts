import { describe, expect, it } from "vitest";

import { DEFAULT_MAX_CHORD_NOTES, getChordShapeByCode, searchChordShapes } from "./chord-shapes";

describe("chord-shapes", () => {
	it("finds a shape by SCI code", () => {
		expect(getChordShapeByCode("-")?.name).toBe("Minor Chord");
		expect(getChordShapeByCode("M7")?.name).toBe("Major Seven");
	});

	it("searches by interval spelling tokens like b3", () => {
		const result = searchChordShapes({
			query: "b3",
			maxNotes: DEFAULT_MAX_CHORD_NOTES,
		});

		expect(result.some((shape) => shape.code === "-")).toBe(true);
		expect(result.every((shape) => shape.noteCount <= DEFAULT_MAX_CHORD_NOTES)).toBe(true);
	});

	it("searches by chord-shape name", () => {
		const result = searchChordShapes({
			query: "major seven",
			maxNotes: 4,
		});

		expect(result.some((shape) => shape.code === "M7")).toBe(true);
	});
});
