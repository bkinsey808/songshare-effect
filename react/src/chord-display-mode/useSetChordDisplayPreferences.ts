import { startTransition } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import type { ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import type { ChordScaleDegreeDisplayType } from "@/shared/user/chordScaleDegreeDisplay";

import saveChordDisplayPreferences from "./saveChordDisplayPreferences";

type ChordDisplayPreferencesUpdate = Readonly<{
	chordDisplayCategory?: ChordDisplayCategoryType;
	chordLetterDisplay?: ChordLetterDisplayType;
	chordScaleDegreeDisplay?: ChordScaleDegreeDisplayType;
}>;

/**
 * Returns a setter that optimistically updates and persists chord display preferences.
 *
 * @returns Async updater for partial chord display preference changes
 */
export default function useSetChordDisplayPreferences(): (
	update: ChordDisplayPreferencesUpdate,
) => Promise<void> {
	const currentUser = useCurrentUser();
	const updateUserSessionUser = useAppStore((state) => state.updateUserSessionUser);

	/**
	 * Merges partial preference changes with the current session user and saves them.
	 *
	 * @param update - Partial chord display preference values to apply
	 * @returns void
	 */
	return async function setChordDisplayPreferences(
		update: ChordDisplayPreferencesUpdate,
	): Promise<void> {
		if (currentUser === undefined) {
			return;
		}

		const nextPreferences = {
			chordDisplayCategory: update.chordDisplayCategory ?? currentUser.chordDisplayCategory,
			chordLetterDisplay: update.chordLetterDisplay ?? currentUser.chordLetterDisplay,
			chordScaleDegreeDisplay:
				update.chordScaleDegreeDisplay ?? currentUser.chordScaleDegreeDisplay,
		};

		startTransition(() => {
			updateUserSessionUser({
				chord_display_category: nextPreferences.chordDisplayCategory,
				chord_letter_display: nextPreferences.chordLetterDisplay,
				chord_scale_degree_display: nextPreferences.chordScaleDegreeDisplay,
			});
		});

		try {
			const savedPreferences = await saveChordDisplayPreferences(nextPreferences);
			startTransition(() => {
				updateUserSessionUser({
					chord_display_category: savedPreferences.chordDisplayCategory,
					chord_letter_display: savedPreferences.chordLetterDisplay,
					chord_scale_degree_display: savedPreferences.chordScaleDegreeDisplay,
				});
			});
		} catch (error) {
			console.error("Failed to persist chord display preferences:", error);
		}
	};
}
