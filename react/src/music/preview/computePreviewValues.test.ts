import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import {
    ChordDisplayCategory,
    type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import {
    ChordDisplayMode,
    type ChordDisplayModeType,
} from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay, type ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import {
    ChordScaleDegreeDisplay,
    type ChordScaleDegreeDisplayType,
} from "@/shared/user/chordScaleDegreeDisplay";

import type { SciInversion } from "@/react/music/inversions/computeSciInversions";
import computePreviewValues from "@/react/music/preview/computePreviewValues";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";

const SONG_KEY_G = "G" as const;
const MAJOR_SHAPE_CODE = "M";
// "[I M]" in letters mode with key G transforms to "[G M]"
const CANONICAL_TOKEN_I_M = "[I M]";
const DISPLAYED_TOKEN_G_M = "[G M]";
const MAJOR_SHAPE_SPELLING = "3,5";

const BASS_NOTE_E = "E" as SongKey;
const SLASH_TOKEN_E = "E slash preview";
const INVERSION_BASE_SHAPE_NAME = "Major";
const RE_ROOTED_SPELLING = "4,b6";
const EMPTY_STRING = "";

const SELECTED_ROOT_I: SelectedRoot = { root: "I", rootType: "roman", label: "I" };

/** Returns the default value for every key — avoids coupling tests to translation strings. */
function stubT(_key: string, defaultValue: string): string {
	return defaultValue;
}

function makeBaseParams(): {
	canonicalToken: string | undefined;
	selectedBassNote: SongKey | undefined;
	activeInversion: SciInversion | undefined;
	selectedShape: ChordShape | undefined;
	selectedRoot: SelectedRoot;
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
	inversionBaseShapeName: string;
	slashPreviewTokens: ReadonlyMap<SongKey, string>;
	t: (key: string, defaultValue: string) => string;
} {
	return {
		canonicalToken: CANONICAL_TOKEN_I_M as string | undefined,
		selectedBassNote: undefined as SongKey | undefined,
		activeInversion: undefined as SciInversion | undefined,
		selectedShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
		selectedRoot: SELECTED_ROOT_I,
		chordDisplayCategory: ChordDisplayCategory.letters,
		chordLetterDisplay: ChordLetterDisplay.standard,
		chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		songKey: SONG_KEY_G as SongKey | "",
		chordDisplayMode: ChordDisplayMode.letters,
		inversionBaseShapeName: EMPTY_STRING,
		slashPreviewTokens: new Map<SongKey, string>() as ReadonlyMap<SongKey, string>,
		t: stubT,
	};
}

describe("computePreviewValues", () => {
	it.each([
		{
			name: "canonicalToken is undefined",
			canonicalToken: undefined,
			expectedPreviewToken: EMPTY_STRING,
		},
		{
			name: "canonicalToken is defined",
			canonicalToken: CANONICAL_TOKEN_I_M,
			expectedPreviewToken: DISPLAYED_TOKEN_G_M,
		},
	])("previewToken: $name", ({ canonicalToken, expectedPreviewToken }) => {
		// Act
		const { previewToken } = computePreviewValues({ ...makeBaseParams(), canonicalToken });

		// Assert
		expect(previewToken).toBe(expectedPreviewToken);
	});

	it.each([
		{
			name: "no bass note — returns selectedRoot unchanged",
			selectedBassNote: undefined as SongKey | undefined,
			expectedRoot: SELECTED_ROOT_I,
		},
		{
			name: "bass note set — returns bass as absolute root",
			selectedBassNote: BASS_NOTE_E,
			expectedRoot: { root: BASS_NOTE_E, rootType: "absolute", label: BASS_NOTE_E },
		},
	])("effectiveDisplayRoot: $name", ({ selectedBassNote, expectedRoot }) => {
		// Act
		const { effectiveDisplayRoot } = computePreviewValues({
			...makeBaseParams(),
			selectedBassNote,
		});

		// Assert
		expect(effectiveDisplayRoot).toStrictEqual(expectedRoot);
	});

	it.each([
		{
			name: "no bass note",
			selectedBassNote: undefined as SongKey | undefined,
			activeInversion: undefined as SciInversion | undefined,
			slashTokens: new Map<SongKey, string>() as ReadonlyMap<SongKey, string>,
			inversionBaseShapeName: INVERSION_BASE_SHAPE_NAME,
			expectedSlashPreviewToken: EMPTY_STRING,
			expectedSlashPreviewShapeName: EMPTY_STRING,
		},
		{
			name: "bass note but no matched shape",
			selectedBassNote: BASS_NOTE_E,
			activeInversion: forceCast<SciInversion>({ matchedShape: undefined }),
			slashTokens: new Map([[BASS_NOTE_E, SLASH_TOKEN_E]]) as ReadonlyMap<SongKey, string>,
			inversionBaseShapeName: INVERSION_BASE_SHAPE_NAME,
			expectedSlashPreviewToken: EMPTY_STRING,
			expectedSlashPreviewShapeName: EMPTY_STRING,
		},
		{
			name: "bass note with matched shape",
			selectedBassNote: BASS_NOTE_E,
			activeInversion: forceCast<SciInversion>({
				matchedShape: forceCast<ChordShape>({ spelling: "b3,5" }),
			}),
			slashTokens: new Map([[BASS_NOTE_E, SLASH_TOKEN_E]]) as ReadonlyMap<SongKey, string>,
			inversionBaseShapeName: INVERSION_BASE_SHAPE_NAME,
			expectedSlashPreviewToken: SLASH_TOKEN_E,
			expectedSlashPreviewShapeName: INVERSION_BASE_SHAPE_NAME,
		},
	])(
		"slashPreviewToken and slashPreviewShapeName: $name",
		({
			selectedBassNote,
			activeInversion,
			slashTokens,
			inversionBaseShapeName,
			expectedSlashPreviewToken,
			expectedSlashPreviewShapeName,
		}) => {
			// Act
			const { slashPreviewToken, slashPreviewShapeName } = computePreviewValues({
				...makeBaseParams(),
				selectedBassNote,
				activeInversion,
				slashPreviewTokens: slashTokens,
				inversionBaseShapeName,
			});

			// Assert
			expect(slashPreviewToken).toBe(expectedSlashPreviewToken);
			expect(slashPreviewShapeName).toBe(expectedSlashPreviewShapeName);
		},
	);

	it.each([
		{
			name: "no bass note — shape spelling",
			selectedBassNote: undefined as SongKey | undefined,
			activeInversion: undefined as SciInversion | undefined,
			expectedSpelling: MAJOR_SHAPE_SPELLING,
		},
		{
			name: "bass note with matched shape (SCI inversion) — base shape spelling, not re-rooted",
			selectedBassNote: BASS_NOTE_E,
			activeInversion: forceCast<SciInversion>({
				matchedShape: forceCast<ChordShape>({ spelling: "b3,5" }),
			}),
			expectedSpelling: MAJOR_SHAPE_SPELLING,
		},
		{
			name: "bass note, no matched shape, active inversion — re-rooted spelling",
			selectedBassNote: BASS_NOTE_E,
			activeInversion: forceCast<SciInversion>({
				matchedShape: undefined,
				reRootedSpelling: RE_ROOTED_SPELLING,
			}),
			expectedSpelling: RE_ROOTED_SPELLING,
		},
		{
			name: "bass note, no matched shape, no active inversion — falls back to shape spelling",
			selectedBassNote: BASS_NOTE_E,
			activeInversion: undefined,
			expectedSpelling: MAJOR_SHAPE_SPELLING,
		},
	])("previewShapeSpelling: $name", ({ selectedBassNote, activeInversion, expectedSpelling }) => {
		// Act
		const { previewShapeSpelling } = computePreviewValues({
			...makeBaseParams(),
			selectedBassNote,
			activeInversion,
		});

		// Assert
		expect(previewShapeSpelling).toBe(expectedSpelling);
	});

	it("passes alternatePreviewLabel and alternatePreviewToken through from computeAlternatePreview", () => {
		// Arrange — letters mode with key G: alternate should be Scale Degree Form showing "[I M]"
		const params = makeBaseParams();

		// Act
		const { alternatePreviewLabel, alternatePreviewToken } = computePreviewValues(params);

		// Assert
		expect(alternatePreviewLabel).toBe("Scale Degree Form");
		expect(alternatePreviewToken).toBe(CANONICAL_TOKEN_I_M);
	});
});
