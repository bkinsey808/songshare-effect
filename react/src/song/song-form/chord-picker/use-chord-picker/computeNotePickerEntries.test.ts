import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { getChordShapeByCode } from "@/shared/music/chord-shapes";

import computeNotePickerEntries from "./computeNotePickerEntries";
import type { ChordInversion } from "./getChordInversions";

const ABSOLUTE_ROOT_C = "C" as const;
const MAJOR_SHAPE_CODE = "M";
const TOTAL_CHROMATIC_STEPS = 12;
const ROOT_SEMITONE_OFFSET = 0;
const MAJOR_THIRD_SEMITONE_OFFSET = 4;
const PERFECT_FIFTH_SEMITONE_OFFSET = 7;
const ROOT_LETTER = "C";
const MAJOR_THIRD_LETTER = "E";
const PERFECT_FIFTH_LETTER = "G";

describe("computeNotePickerEntries", () => {
	it("returns 12 entries for C major with correct active state at root, third, and fifth", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion: undefined,
			selectedShape,
		});

		// Assert
		expect(entries).toHaveLength(TOTAL_CHROMATIC_STEPS);
		expect(entries[ROOT_SEMITONE_OFFSET]?.isActive).toBe(true);
		expect(entries[MAJOR_THIRD_SEMITONE_OFFSET]?.isActive).toBe(true);
		expect(entries[PERFECT_FIFTH_SEMITONE_OFFSET]?.isActive).toBe(true);
	});

	it("returns correct letter names at root, third, and fifth for C major", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion: undefined,
			selectedShape,
		});

		// Assert
		expect(entries[ROOT_SEMITONE_OFFSET]?.letterName).toBe(ROOT_LETTER);
		expect(entries[MAJOR_THIRD_SEMITONE_OFFSET]?.letterName).toBe(MAJOR_THIRD_LETTER);
		expect(entries[PERFECT_FIFTH_SEMITONE_OFFSET]?.letterName).toBe(PERFECT_FIFTH_LETTER);
	});

	it("sets all letterNames to undefined when absoluteRoot is undefined", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: undefined,
			activeInversion: undefined,
			selectedShape,
		});

		// Assert
		expect(entries).toHaveLength(TOTAL_CHROMATIC_STEPS);
		for (const entry of entries) {
			expect(entry.letterName).toBeUndefined();
		}
		// Root interval is still active even without a resolved letter name
		expect(entries[ROOT_SEMITONE_OFFSET]?.isActive).toBe(true);
	});

	it("uses reRootedSpelling intervals when an active inversion is provided", () => {
		// Arrange
		const activeInversion = forceCast<ChordInversion>({ reRootedSpelling: "b3,b6" });
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);
		const MINOR_THIRD_SEMITONE_OFFSET = 3;
		const MINOR_SIXTH_SEMITONE_OFFSET = 8;

		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion,
			selectedShape,
		});

		// Assert – intervals come from activeInversion, not selectedShape spelling
		expect(entries[MINOR_THIRD_SEMITONE_OFFSET]?.isActive).toBe(true);
		expect(entries[MINOR_SIXTH_SEMITONE_OFFSET]?.isActive).toBe(true);
		expect(entries[MAJOR_THIRD_SEMITONE_OFFSET]?.isActive).toBe(false);
		expect(entries[PERFECT_FIFTH_SEMITONE_OFFSET]?.isActive).toBe(false);
	});
});
