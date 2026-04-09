import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import type { ChordShape } from "@/shared/music/chord-shapes";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import {
    ChordDisplayCategory,
    type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import { getChordDisplayModeFromPreferences } from "@/shared/user/chord-display/chordDisplayPreferences";
import type { ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import type { ChordScaleDegreeDisplayType } from "@/shared/user/chordScaleDegreeDisplay";

import formatLetterFormPreview from "@/react/music/preview/formatLetterFormPreview";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";

type ComputeAlternatePreviewParams = Readonly<{
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
	songKey: SongKey | "";
	canonicalToken: string | undefined;
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	selectedBassNote: SongKey | undefined;
	t: (key: string, defaultValue: string) => string;
}>;

type ComputeAlternatePreviewResult = Readonly<{
	alternatePreviewLabel: string;
	alternatePreviewToken: string;
}>;

/**
 * Derives the alternate-form preview label and token shown alongside the primary chord token.
 *
 * @param chordDisplayCategory - Active display category (letters or scale degree)
 * @param chordLetterDisplay - Letter display preference
 * @param chordScaleDegreeDisplay - Scale degree display preference
 * @param songKey - Current song key
 * @param canonicalToken - The canonical chord token for display transformation
 * @param selectedRoot - Currently selected chord root
 * @param selectedShape - Currently selected chord shape
 * @param t - Translation function
 * @returns Alternate preview label and formatted token
 */
export default function computeAlternatePreview({
	chordDisplayCategory,
	chordLetterDisplay,
	chordScaleDegreeDisplay,
	songKey,
	canonicalToken,
	selectedRoot,
	selectedShape,
	selectedBassNote,
	t,
}: ComputeAlternatePreviewParams): ComputeAlternatePreviewResult {
	const alternatePreviewCategory: ChordDisplayCategoryType =
		chordDisplayCategory === ChordDisplayCategory.letters
			? ChordDisplayCategory.scaleDegree
			: ChordDisplayCategory.letters;
	const alternatePreviewMode = getChordDisplayModeFromPreferences({
		chordDisplayCategory: alternatePreviewCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
	});
	const hasScaleDegreeAlternatePreview =
		alternatePreviewCategory !== ChordDisplayCategory.scaleDegree || isSongKey(songKey);
	let alternatePreviewLabel = "—";
	if (hasScaleDegreeAlternatePreview) {
		alternatePreviewLabel =
			alternatePreviewCategory === ChordDisplayCategory.letters
				? t("song.chordLetterForm", "Letter Form")
				: t("song.chordScaleDegreeForm", "Scale Degree Form");
	}
	const alternatePreviewCompactToken =
		!hasScaleDegreeAlternatePreview || canonicalToken === undefined
			? ""
			: transformChordTextForDisplay(canonicalToken, {
					chordDisplayMode: alternatePreviewMode,
					songKey,
				});
	let alternatePreviewToken = "";
	if (!hasScaleDegreeAlternatePreview) {
		alternatePreviewToken = "";
	} else if (alternatePreviewCategory === ChordDisplayCategory.letters) {
		alternatePreviewToken = [
			alternatePreviewCompactToken,
			formatLetterFormPreview({
				selectedRoot,
				selectedShape,
				chordDisplayMode: alternatePreviewMode,
				songKey,
				bassNote: selectedBassNote,
			}),
		]
			.filter((part) => part !== "")
			.join(" ");
	} else if (canonicalToken !== undefined) {
		alternatePreviewToken = transformChordTextForDisplay(canonicalToken, {
			chordDisplayMode: alternatePreviewMode,
			songKey,
		});
	}
	return { alternatePreviewLabel, alternatePreviewToken };
}
