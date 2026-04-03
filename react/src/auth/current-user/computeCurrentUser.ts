import type { CurrentUser } from "@/react/auth/current-user/CurrentUser.type";
import type { UserSessionData } from "@/shared/userSessionData";
import { coerceChordDisplayMode } from "@/shared/user/chordDisplayMode";
import { coerceSlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { coerceSlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

export default function computeCurrentUser(
	userSessionData: UserSessionData | undefined,
): CurrentUser | undefined {
	if (userSessionData === undefined) {
		return undefined;
	}

	return {
		chordDisplayMode: coerceChordDisplayMode(userSessionData.user.chord_display_mode),
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
