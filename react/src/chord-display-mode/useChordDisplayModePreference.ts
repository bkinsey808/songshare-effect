import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import {
	ChordDisplayCategory,
	type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import { getChordDisplayModeFromPreferences } from "@/shared/user/chord-display/chordDisplayPreferences";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay, type ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import {
	ChordScaleDegreeDisplay,
	type ChordScaleDegreeDisplayType,
} from "@/shared/user/chordScaleDegreeDisplay";

/**
 * Resolves the current user's chord display settings and falls back to stable
 * defaults when the user is anonymous.
 *
 * @returns Current chord display preferences used across the UI
 */
export default function useChordDisplayModePreference(): {
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordDisplayMode: ChordDisplayModeType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
} {
	const currentUser = useCurrentUser();
	const chordDisplayCategory =
		currentUser?.chordDisplayCategory ?? ChordDisplayCategory.scaleDegree;
	const chordLetterDisplay = currentUser?.chordLetterDisplay ?? ChordLetterDisplay.standard;
	const chordScaleDegreeDisplay =
		currentUser?.chordScaleDegreeDisplay ?? ChordScaleDegreeDisplay.roman;
	const chordDisplayMode = getChordDisplayModeFromPreferences({
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
	});

	return {
		chordDisplayCategory,
		chordLetterDisplay,
		chordDisplayMode,
		chordScaleDegreeDisplay,
	};
}
