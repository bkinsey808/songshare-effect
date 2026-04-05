import type { CurrentUser } from "@/react/auth/current-user/CurrentUser.type";
import {
	coerceChordDisplayPreferences,
	getChordDisplayModeFromPreferences,
} from "@/shared/user/chord-display/chordDisplayPreferences";
import { coerceSlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { coerceSlideOrientationPreference } from "@/shared/user/slideOrientationPreference";
import type { UserSessionData } from "@/shared/userSessionData";

/**
 * Converts stored session data into the normalized current-user shape consumed by the React app.
 *
 * @param userSessionData - Session payload from the app store, if present
 * @returns Normalized current user data, or `undefined` when there is no active session
 */
export default function computeCurrentUser(
	userSessionData: UserSessionData | undefined,
): CurrentUser | undefined {
	if (userSessionData === undefined) {
		return undefined;
	}

	const chordDisplayPreferences = coerceChordDisplayPreferences({
		chordDisplayCategory: userSessionData.user.chord_display_category,
		chordLetterDisplay: userSessionData.user.chord_letter_display,
		chordScaleDegreeDisplay: userSessionData.user.chord_scale_degree_display,
	});

	return {
		chordDisplayCategory: chordDisplayPreferences.chordDisplayCategory,
		chordLetterDisplay: chordDisplayPreferences.chordLetterDisplay,
		chordDisplayMode: getChordDisplayModeFromPreferences(chordDisplayPreferences),
		chordScaleDegreeDisplay: chordDisplayPreferences.chordScaleDegreeDisplay,
		email: userSessionData.user.email,
		name: userSessionData.user.name,
		role: userSessionData.user.role,
		slideNumberPreference: coerceSlideNumberPreference(
			userSessionData.user.slide_number_preference,
		),
		slideOrientationPreference: coerceSlideOrientationPreference(
			userSessionData.user.slide_orientation_preference,
		),
		userId: userSessionData.user.user_id,
		username: userSessionData.userPublic.username,
	};
}
