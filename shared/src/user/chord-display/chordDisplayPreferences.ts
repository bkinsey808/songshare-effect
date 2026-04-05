import {
	ChordDisplayCategory,
	coerceChordDisplayCategory,
	type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import {
	ChordLetterDisplay,
	coerceChordLetterDisplay,
	type ChordLetterDisplayType,
} from "@/shared/user/chordLetterDisplay";
import {
	ChordScaleDegreeDisplay,
	coerceChordScaleDegreeDisplay,
	type ChordScaleDegreeDisplayType,
} from "@/shared/user/chordScaleDegreeDisplay";

import { ChordDisplayMode, type ChordDisplayModeType } from "./effectiveChordDisplayMode";

/**
 * Stores the split preference values that determine how chord text should render for a user.
 */
export type ChordDisplayPreferences = Readonly<{
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
}>;

/**
 * Resolves the legacy effective chord display mode from the split user preferences.
 *
 * @param chordDisplayCategory - Whether the user prefers letter names or scale degrees
 * @param chordLetterDisplay - Which letter naming system to use when letters are selected
 * @param chordScaleDegreeDisplay - Which scale-degree system to use when scale degrees are selected
 * @returns Effective chord display mode derived from the stored preferences
 */
export function getChordDisplayModeFromPreferences({
	chordDisplayCategory,
	chordLetterDisplay,
	chordScaleDegreeDisplay,
}: ChordDisplayPreferences): ChordDisplayModeType {
	if (chordDisplayCategory === ChordDisplayCategory.letters) {
		return chordLetterDisplay === ChordLetterDisplay.german
			? ChordDisplayMode.german
			: ChordDisplayMode.letters;
	}

	if (chordScaleDegreeDisplay === ChordScaleDegreeDisplay.solfege) {
		return ChordDisplayMode.solfege;
	}

	if (chordScaleDegreeDisplay === ChordScaleDegreeDisplay.sargam) {
		return ChordDisplayMode.sargam;
	}

	return ChordDisplayMode.roman;
}

/**
 * Normalizes persisted or API-provided chord display preference values into safe defaults.
 *
 * @param values - Raw preference values that may be missing or invalid
 * @returns Valid chord display preferences for application use
 */
export function coerceChordDisplayPreferences(
	values: Readonly<{
		chordDisplayCategory: string | undefined;
		chordLetterDisplay: string | undefined;
		chordScaleDegreeDisplay: string | undefined;
	}>,
): ChordDisplayPreferences {
	return {
		chordDisplayCategory: coerceChordDisplayCategory(values.chordDisplayCategory),
		chordLetterDisplay: coerceChordLetterDisplay(values.chordLetterDisplay),
		chordScaleDegreeDisplay: coerceChordScaleDegreeDisplay(values.chordScaleDegreeDisplay),
	};
}
