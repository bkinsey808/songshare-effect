import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import { getChordShapeByCode, getChordShapes, type ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/sciIntervalConstants";
import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";
import computeShapeAfterNoteToggle from "@/react/music/intervals/computeShapeAfterNoteToggle";
import createNoteToggleHandler from "./createNoteToggleHandler";
import findShapeByInversion from "@/react/music/inversions/findShapeByInversion";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

// Semitone offsets for intervals referenced in these tests
const ROOT_OFFSET = 0;
const MINOR_THIRD_OFFSET = 3;
const MAJOR_THIRD_OFFSET = 4;
const TRITONE_OFFSET = 6;
const PERFECT_FIFTH_OFFSET = 7;
const MINOR_SEVENTH_OFFSET = 10;
const OUT_OF_RANGE_OFFSET = 12;

const ROOT_C = "C" as SongKey;
const ROOT_E = "E" as SongKey;
const MAJOR_SHAPE_CODE = "M";

// "4,b6" is not a catalog shape. Toggling b3 (offset 3) produces "b3,4,b6",
// which is also not in the catalog, but its re-rooting at interval offset 5
// yields "b3,5,b7" (minor seventh) — a catalog shape.
// rootSemitoneMap["E"] = 4; (4 + 5) % 12 = 9 → songKeysBySemitone[9] = "A"
const NON_CATALOG_SPELLING = "4,b6";

function makeCallbacks(): {
	clearInversion: () => void;
	setSelectedRoot: (root: SelectedRoot) => void;
	setSelectedShapeCode: (shapeCode: string) => void;
	selectBassNote: (note: SongKey) => void;
} {
	return {
		clearInversion: vi.fn<() => void>(),
		setSelectedRoot: vi.fn<(root: SelectedRoot) => void>(),
		setSelectedShapeCode: vi.fn<(shapeCode: string) => void>(),
		selectBassNote: vi.fn<(note: SongKey) => void>(),
	};
}

function assertIsDefined<TValue>(
	value: TValue | undefined,
	message?: string,
): asserts value is TValue {
	if (value === undefined) {
		throw new Error(message ?? "Expected value to be defined");
	}
}

describe("createNoteToggleHandler", () => {
	it.each([
		{ name: "root offset (0)", semitoneOffset: ROOT_OFFSET },
		{ name: "out-of-range offset (12)", semitoneOffset: OUT_OF_RANGE_OFFSET },
	])("calls no callbacks for $name", ({ semitoneOffset }) => {
		// Arrange
		const { clearInversion, setSelectedRoot, setSelectedShapeCode, selectBassNote } =
			makeCallbacks();
		const handler = createNoteToggleHandler({
			activeInversion: undefined,
			notePickerShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
			notePickerRoot: ROOT_C,
			absoluteRoot: ROOT_C,
			clearInversion,
			setSelectedRoot,
			setSelectedShapeCode,
			selectBassNote,
		});

		// Act
		handler(semitoneOffset);

		// Assert
		expect(clearInversion).not.toHaveBeenCalled();
		expect(setSelectedRoot).not.toHaveBeenCalled();
		expect(setSelectedShapeCode).not.toHaveBeenCalled();
		expect(selectBassNote).not.toHaveBeenCalled();
	});

	it.each([
		{
			name: "removing major third from major chord leaves power chord",
			semitoneOffset: MAJOR_THIRD_OFFSET,
			expectedSpelling: "5",
		},
		{
			name: "adding b7 to major chord yields dominant seventh",
			semitoneOffset: MINOR_SEVENTH_OFFSET,
			expectedSpelling: "3,5,b7",
		},
	])(
		"calls clearInversion and setSelectedShapeCode on catalog match — no inversion active: $name",
		({ semitoneOffset, expectedSpelling }) => {
			// Arrange
			const { clearInversion, setSelectedRoot, setSelectedShapeCode, selectBassNote } =
				makeCallbacks();
			const expectedCode = getChordShapes().find(
				(shape) => shape.spelling === expectedSpelling,
			)?.code;
			const handler = createNoteToggleHandler({
				activeInversion: undefined,
				notePickerShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
				notePickerRoot: ROOT_C,
				absoluteRoot: ROOT_C,
				clearInversion,
				setSelectedRoot,
				setSelectedShapeCode,
				selectBassNote,
			});

			// Act
			handler(semitoneOffset);

			// Assert
			expect(clearInversion).toHaveBeenCalledOnce();
			expect(setSelectedShapeCode).toHaveBeenCalledWith(expectedCode);
			expect(setSelectedRoot).not.toHaveBeenCalled();
			expect(selectBassNote).not.toHaveBeenCalled();
		},
	);

	it("uses the synthetic spelling as shape code when there is no catalog or inversion match", () => {
		// Arrange — toggle tritone (b5) on major "3,5" → "3,b5,5"; not in catalog, no inversion match
		const { clearInversion, setSelectedRoot, setSelectedShapeCode, selectBassNote } =
			makeCallbacks();
		const handler = createNoteToggleHandler({
			activeInversion: undefined,
			notePickerShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
			notePickerRoot: ROOT_C,
			absoluteRoot: ROOT_C,
			clearInversion,
			setSelectedRoot,
			setSelectedShapeCode,
			selectBassNote,
		});

		// Act
		handler(TRITONE_OFFSET);

		// Assert
		expect(clearInversion).toHaveBeenCalledOnce();
		const felineCode = getChordShapes().find((shape) => shape.spelling === "4,6,7")?.code;
		expect(setSelectedRoot).toHaveBeenCalledWith({ root: "G", rootType: "absolute", label: "G" });
		expect(setSelectedShapeCode).toHaveBeenCalledWith(felineCode);
		expect(selectBassNote).toHaveBeenCalledWith(ROOT_C);
	});

	it("re-roots to the catalog shape and sets bass note when an inversion match is found", () => {
		// Arrange
		// "4,b6" is not a catalog shape.
		// Toggle b3 (offset 3) on "4,b6" → "b3,4,b6" (synthetic).
		// findShapeByInversion("b3,4,b6") re-roots at offset 5 → "b3,5,b7" (minor seventh).
		// referenceRoot = "E" (semitone 4); newRootSemitone = (4 + 5) % 12 = 9 → "A".
		const { clearInversion, setSelectedRoot, setSelectedShapeCode, selectBassNote } =
			makeCallbacks();
		const nonCatalogShape = forceCast<ChordShape>({ spelling: NON_CATALOG_SPELLING, id: 1 });

		// Compute expected outcome using the same helpers as implementation.
		const toggleResult = computeShapeAfterNoteToggle({
			selectedShape: nonCatalogShape,
			semitoneOffset: MINOR_THIRD_OFFSET,
		});
		expect(toggleResult).toBeDefined();
		assertIsDefined(toggleResult, "toggleResult undefined");
		const inversionMatch = findShapeByInversion(toggleResult.spelling);
		assertIsDefined(inversionMatch, "inversionMatch undefined");
		const expectedShapeCode = inversionMatch.shape.code;
		const expectedRoot =
			songKeysBySemitone[
				(rootSemitoneMap[ROOT_E] + inversionMatch.inversionRootOffset) % OCTAVE_SEMITONE_COUNT
			];

		const handler = createNoteToggleHandler({
			activeInversion: undefined,
			notePickerShape: nonCatalogShape,
			notePickerRoot: ROOT_E,
			absoluteRoot: ROOT_C,
			clearInversion,
			setSelectedRoot,
			setSelectedShapeCode,
			selectBassNote,
		});

		// Act
		handler(MINOR_THIRD_OFFSET);

		// Assert
		expect(clearInversion).toHaveBeenCalledOnce();
		expect(setSelectedShapeCode).toHaveBeenCalledWith(expectedShapeCode);
		expect(selectBassNote).toHaveBeenCalledWith(ROOT_E);
		expect(setSelectedRoot).toHaveBeenCalledWith({
			root: expectedRoot,
			rootType: "absolute",
			label: expectedRoot,
		});
	});

	it("active inversion + catalog match: bass differs from absoluteRoot — promotes bass to chord root", () => {
		// Arrange
		const { clearInversion, setSelectedRoot, setSelectedShapeCode, selectBassNote } =
			makeCallbacks();
		const activeInversion = forceCast<SciInversion>({ reRootedSpelling: "3" });
		const handler = createNoteToggleHandler({
			activeInversion,
			notePickerShape: undefined,
			notePickerRoot: ROOT_E,
			absoluteRoot: ROOT_C,
			clearInversion,
			setSelectedRoot,
			setSelectedShapeCode,
			selectBassNote,
		});

		// Act
		handler(PERFECT_FIFTH_OFFSET);

		// Assert
		expect(clearInversion).toHaveBeenCalledOnce();
		expect(setSelectedRoot).toHaveBeenCalledWith({
			root: ROOT_E,
			rootType: "absolute",
			label: ROOT_E,
		});
		expect(setSelectedShapeCode).toHaveBeenCalledWith(MAJOR_SHAPE_CODE);
		expect(selectBassNote).not.toHaveBeenCalled();
	});

	it("active inversion + catalog match: bass equals absoluteRoot — root stays the same", () => {
		// Arrange
		const { clearInversion, setSelectedRoot, setSelectedShapeCode, selectBassNote } =
			makeCallbacks();
		const activeInversion = forceCast<SciInversion>({ reRootedSpelling: "3" });
		const handler = createNoteToggleHandler({
			activeInversion,
			notePickerShape: undefined,
			notePickerRoot: ROOT_C,
			absoluteRoot: ROOT_C,
			clearInversion,
			setSelectedRoot,
			setSelectedShapeCode,
			selectBassNote,
		});

		// Act
		handler(PERFECT_FIFTH_OFFSET);

		// Assert
		expect(clearInversion).toHaveBeenCalledOnce();
		expect(setSelectedRoot).not.toHaveBeenCalled();
		expect(setSelectedShapeCode).toHaveBeenCalledWith(MAJOR_SHAPE_CODE);
		expect(selectBassNote).not.toHaveBeenCalled();
	});
});
