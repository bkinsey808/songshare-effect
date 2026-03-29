import type { CurrentUser } from "@/react/auth/current-user/CurrentUser.type";
import type { UserSessionData } from "@/shared/userSessionData";
import { coerceSlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

export default function computeCurrentUser(
	userSessionData: UserSessionData | undefined,
): CurrentUser | undefined {
	if (userSessionData === undefined) {
		return undefined;
	}

	return {
		email: userSessionData.user.email,
		name: userSessionData.user.name,
		role: userSessionData.user.role,
		slideOrientationPreference: coerceSlideOrientationPreference(
			userSessionData.user.slide_orientation_preference,
		),
		userId: userSessionData.user.user_id,
		username: userSessionData.userPublic.username,
	};
}
