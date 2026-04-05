import type { ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import type { ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import type { ChordScaleDegreeDisplayType } from "@/shared/user/chordScaleDegreeDisplay";
import type { SlideNumberPreferenceType } from "@/shared/user/slideNumberPreference";
import type { SlideOrientationPreferenceType } from "@/shared/user/slideOrientationPreference";

/**
 * Normalized signed-in user data consumed by the React app after session coercion.
 */
export type CurrentUser = Readonly<{
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordDisplayMode: ChordDisplayModeType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
	email: string;
	name: string;
	role: string;
	slideNumberPreference: SlideNumberPreferenceType;
	slideOrientationPreference: SlideOrientationPreferenceType;
	userId: string;
	username: string;
}>;
