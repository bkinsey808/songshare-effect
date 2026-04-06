import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import {
    ChordDisplayCategory,
    type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import { getChordDisplayModeFromPreferences } from "@/shared/user/chord-display/chordDisplayPreferences";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import type { ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import type { ChordScaleDegreeDisplayType } from "@/shared/user/chordScaleDegreeDisplay";

/**
 * Derives the effective display mode for the root picker.
 *
 * When the active display category is scale degree but no song key is set,
 * falls back to letter form so the root picker always shows readable note names.
 *
 * @param chordDisplayCategory - Currently active display category
 * @param songKey - Current song key (may be empty when no key is set)
 * @param chordLetterDisplay - Letter display preference
 * @param chordScaleDegreeDisplay - Scale degree display preference
 * @param chordDisplayMode - Currently active chord display mode
 * @returns Display mode the root picker should use
 */
export default function computeRootPickerDisplayMode({
	chordDisplayCategory,
	songKey,
	chordLetterDisplay,
	chordScaleDegreeDisplay,
	chordDisplayMode,
}: Readonly<{
	chordDisplayCategory: ChordDisplayCategoryType;
	songKey: SongKey | "";
	chordLetterDisplay: ChordLetterDisplayType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
	chordDisplayMode: ChordDisplayModeType;
}>): ChordDisplayModeType {
	return chordDisplayCategory === ChordDisplayCategory.scaleDegree && !isSongKey(songKey)
		? getChordDisplayModeFromPreferences({
				chordDisplayCategory: ChordDisplayCategory.letters,
				chordLetterDisplay,
				chordScaleDegreeDisplay,
			})
		: chordDisplayMode;
}
