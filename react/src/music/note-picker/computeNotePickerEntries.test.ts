import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";

import computeNotePickerEntries from "@/react/music/note-picker/computeNotePickerEntries";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

const ABSOLUTE_ROOT_C = "C" as const;
const ABSOLUTE_ROOT_E = "E" as const;
const MAJOR_SHAPE_CODE = "M";
const TOTAL_CHROMATIC_STEPS = 12;
const ROOT_OFFSET = 0;
const MINOR_THIRD_OFFSET = 3;
const MAJOR_THIRD_OFFSET = 4;
const TRITONE_OFFSET = 6;
const PERFECT_FIFTH_OFFSET = 7;
const MINOR_SIXTH_OFFSET = 8;

describe("computeNotePickerEntries", () => {
	it("returns 12 entries for C major with correct active and inactive states", () => {
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
		expect(entries[ROOT_OFFSET]?.isActive).toBe(true);
		expect(entries[MAJOR_THIRD_OFFSET]?.isActive).toBe(true);
		expect(entries[PERFECT_FIFTH_OFFSET]?.isActive).toBe(true);
		expect(entries[MINOR_THIRD_OFFSET]?.isActive).toBe(false);
		expect(entries[TRITONE_OFFSET]?.isActive).toBe(false);
	});

	it("returns correct letter names for C major", () => {
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
		expect(entries[ROOT_OFFSET]?.letterName).toBe("C");
		expect(entries[MAJOR_THIRD_OFFSET]?.letterName).toBe("E");
		expect(entries[PERFECT_FIFTH_OFFSET]?.letterName).toBe("G");
	});

	it("uses selectedBassNote as the letter root instead of absoluteRoot", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act — absoluteRoot is C but selectedBassNote is E
		const entries = computeNotePickerEntries({
			selectedBassNote: ABSOLUTE_ROOT_E,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion: undefined,
			selectedShape,
		});

		// Assert – letters are anchored to E, not C
		expect(entries[ROOT_OFFSET]?.letterName).toBe("E");
		expect(entries[PERFECT_FIFTH_OFFSET]?.letterName).toBe("B");
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
		expect(entries[ROOT_OFFSET]?.isActive).toBe(true);
	});

	it("uses the fallback letter root when provided without a selected root", () => {
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: undefined,
			fallbackLetterRoot: ABSOLUTE_ROOT_C,
			activeInversion: undefined,
			selectedShape,
		});

		expect(entries[ROOT_OFFSET]?.letterName).toBe("C");
		expect(entries[MAJOR_THIRD_OFFSET]?.letterName).toBe("E");
		expect(entries[PERFECT_FIFTH_OFFSET]?.letterName).toBe("G");
	});

	it("marks only root as active when selectedShape is undefined", () => {
		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion: undefined,
			selectedShape: undefined,
		});

		// Assert
		expect(entries[ROOT_OFFSET]?.isActive).toBe(true);
		expect(entries[MAJOR_THIRD_OFFSET]?.isActive).toBe(false);
		expect(entries[PERFECT_FIFTH_OFFSET]?.isActive).toBe(false);
	});

	it("uses reRootedSpelling intervals when an active inversion is provided", () => {
		// Arrange
		const activeInversion = forceCast<SciInversion>({ reRootedSpelling: "b3,b6" });
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion,
			selectedShape,
		});

		// Assert – intervals come from activeInversion, not selectedShape spelling
		expect(entries[MINOR_THIRD_OFFSET]?.isActive).toBe(true);
		expect(entries[MINOR_SIXTH_OFFSET]?.isActive).toBe(true);
		expect(entries[MAJOR_THIRD_OFFSET]?.isActive).toBe(false);
		expect(entries[PERFECT_FIFTH_OFFSET]?.isActive).toBe(false);
	});

	it.each([
		{
			name: "converts b5 to #4 when 5 is present and 4 is absent",
			spelling: "b5,5",
			checkOffset: TRITONE_OFFSET,
			expected: "#4",
		},
		{
			name: "keeps inactive b5 as b5 even when 5 is active and 4 is absent",
			spelling: "5",
			checkOffset: TRITONE_OFFSET,
			expected: "b5",
		},
		{
			name: "keeps b5 when 4 is also present (lower natural occupied)",
			spelling: "4,b5,5",
			checkOffset: TRITONE_OFFSET,
			expected: "b5",
		},
		{
			name: "keeps b3 when 3 is absent (same natural not present)",
			spelling: "b3,5",
			checkOffset: MINOR_THIRD_OFFSET,
			expected: "b3",
		},
		{
			name: "converts b6 to #5 when 6 is present and 5 is absent",
			spelling: "b6,6",
			checkOffset: MINOR_SIXTH_OFFSET,
			expected: "#5",
		},
	])("displayInterval sharp preference: $name", ({ spelling, checkOffset, expected }) => {
		// Arrange
		const selectedShape = forceCast<ChordShape>({ spelling });

		// Act
		const entries = computeNotePickerEntries({
			selectedBassNote: undefined,
			absoluteRoot: ABSOLUTE_ROOT_C,
			activeInversion: undefined,
			selectedShape,
		});

		// Assert
		expect(entries[checkOffset]?.displayInterval).toBe(expected);
	});
});
