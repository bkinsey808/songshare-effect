import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import type { ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import type { ChordScaleDegreeDisplayType } from "@/shared/user/chordScaleDegreeDisplay";

import type { SciInversion } from "@/react/music/inversions/computeSciInversions";
import computeAlternatePreview from "@/react/music/preview/computeAlternatePreview";
import computePreviewSelectedRoot from "@/react/music/preview/computePreviewSelectedRoot";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import computeCanonicalToken from "@/react/music/sci/computeCanonicalToken";

type ComputePreviewValuesParams = Readonly<{
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
	fallbackPreviewRoot?: SongKey;
	t: (key: string, defaultValue: string) => string;
}>;

type ComputePreviewValuesResult = Readonly<{
	previewToken: string;
	alternatePreviewLabel: string;
	alternatePreviewToken: string;
	effectiveDisplayRoot: SelectedRoot;
	slashPreviewToken: string;
	slashPreviewShapeName: string;
	previewShapeSpelling: string;
}>;

/**
 * Derives all preview display values for the chord picker.
 *
 * @param canonicalToken - Canonical chord token for primary display
 * @param selectedBassNote - Active bass note (set when an inversion is selected)
 * @param activeInversion - Active inversion card, if any
 * @param selectedShape - Currently selected chord shape
 * @param selectedRoot - Currently selected chord root
 * @param chordDisplayCategory - Active display category (letters or scale degree)
 * @param chordLetterDisplay - Letter display preference
 * @param chordScaleDegreeDisplay - Scale degree display preference
 * @param songKey - Current song key
 * @param chordDisplayMode - Current display mode
 * @param inversionBaseShapeName - Name of the pre-inversion base shape
 * @param slashPreviewTokens - Map of bass note → slash chord display token
 * @param fallbackPreviewRoot - Concrete preview root to use when the picker root is `Any`
 * @param t - Translation function
 * @returns All derived preview values needed by the chord picker UI
 */
export default function computePreviewValues({
	canonicalToken,
	selectedBassNote,
	activeInversion,
	selectedShape,
	selectedRoot,
	chordDisplayCategory,
	chordLetterDisplay,
	chordScaleDegreeDisplay,
	songKey,
	chordDisplayMode,
	inversionBaseShapeName,
	slashPreviewTokens,
	fallbackPreviewRoot,
	t,
}: ComputePreviewValuesParams): ComputePreviewValuesResult {
	const previewSelectedRoot = computePreviewSelectedRoot(selectedRoot, fallbackPreviewRoot);
	const previewCanonicalToken =
		canonicalToken ??
		(selectedRoot.rootType === "any"
			? computeCanonicalToken({
					selectedRoot: previewSelectedRoot,
					selectedShapeCode: selectedShape?.code,
					songKey,
				})
			: undefined);
	let previewToken = "";
	if (previewCanonicalToken !== undefined) {
		previewToken = transformChordTextForDisplay(previewCanonicalToken, {
			chordDisplayMode,
			songKey,
		});
	}

	const { alternatePreviewLabel, alternatePreviewToken } = computeAlternatePreview({
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		songKey,
		canonicalToken: previewCanonicalToken,
		selectedRoot: previewSelectedRoot,
		selectedShape,
		selectedBassNote,
		t,
	});

	// When an inversion is active, display the bass note as the root in the root picker.
	const effectiveDisplayRoot: SelectedRoot =
		selectedBassNote === undefined
			? selectedRoot
			: { root: selectedBassNote, rootType: "absolute", label: selectedBassNote };

	const slashPreviewToken =
		selectedBassNote !== undefined && activeInversion?.matchedShape !== undefined
			? (slashPreviewTokens.get(selectedBassNote) ?? "")
			: "";

	const slashPreviewShapeName =
		selectedBassNote !== undefined && activeInversion?.matchedShape !== undefined
			? inversionBaseShapeName
			: "";

	// For pure slash chords, show the re-rooted spelling (e.g. 4,b6 for A-/E) rather than
	// the base chord's spelling (b3,5), since the bass perspective is what matters.
	const previewShapeSpelling =
		selectedBassNote !== undefined && activeInversion?.matchedShape === undefined
			? (activeInversion?.reRootedSpelling ?? selectedShape?.spelling ?? "")
			: (selectedShape?.spelling ?? "");

	return {
		previewToken,
		alternatePreviewLabel,
		alternatePreviewToken,
		effectiveDisplayRoot,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
	};
}
