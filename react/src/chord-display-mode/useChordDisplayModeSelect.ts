import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import {
	coerceChordDisplayCategory,
	type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import {
	coerceChordLetterDisplay,
	type ChordLetterDisplayType,
} from "@/shared/user/chordLetterDisplay";
import {
	coerceChordScaleDegreeDisplay,
	type ChordScaleDegreeDisplayType,
} from "@/shared/user/chordScaleDegreeDisplay";

import useChordDisplayModePreference from "./useChordDisplayModePreference";
import useSetChordDisplayPreferences from "./useSetChordDisplayPreferences";

type UseChordDisplayModeSelectResult = Readonly<{
	currentUser: ReturnType<typeof useCurrentUser>;
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
	handleCategoryChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	handleLetterDisplayChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	handleScaleDegreeDisplayChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}>;

/**
 * Resolves the current chord display settings and change handlers for the preference select UI.
 *
 * @returns Current user state, display values, and change handlers for the select controls
 */
export default function useChordDisplayModeSelect(): UseChordDisplayModeSelectResult {
	const currentUser = useCurrentUser();
	const { chordDisplayCategory, chordLetterDisplay, chordScaleDegreeDisplay } =
		useChordDisplayModePreference();
	const setChordDisplayPreferences = useSetChordDisplayPreferences();

	/**
	 * Updates the selected top-level chord display category.
	 *
	 * @param event - Select change event carrying the next category value
	 * @returns void
	 */
	function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		void setChordDisplayPreferences({
			chordDisplayCategory: coerceChordDisplayCategory(event.target.value),
		});
	}

	/**
	 * Updates the preferred letter-based notation style.
	 *
	 * @param event - Select change event carrying the next letter-display value
	 * @returns void
	 */
	function handleLetterDisplayChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		void setChordDisplayPreferences({
			chordLetterDisplay: coerceChordLetterDisplay(event.target.value),
		});
	}

	/**
	 * Updates the preferred scale-degree notation style.
	 *
	 * @param event - Select change event carrying the next scale-degree-display value
	 * @returns void
	 */
	function handleScaleDegreeDisplayChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		void setChordDisplayPreferences({
			chordScaleDegreeDisplay: coerceChordScaleDegreeDisplay(event.target.value),
		});
	}

	return {
		currentUser,
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		handleCategoryChange,
		handleLetterDisplayChange,
		handleScaleDegreeDisplayChange,
	};
}
