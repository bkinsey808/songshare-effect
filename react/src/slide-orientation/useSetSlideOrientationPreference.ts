import { startTransition } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import type { SlideOrientationPreferenceType } from "@/shared/user/slideOrientationPreference";

import saveSlideOrientationPreference from "./saveSlideOrientationPreference";

/**
 * Hook that returns a function to persist and update the user's
 * slide orientation preference.
 *
 * @returns Async function to set the slide orientation preference
 */
export default function useSetSlideOrientationPreference(): (
	slideOrientationPreference: SlideOrientationPreferenceType,
) => Promise<void> {
	const currentUser = useCurrentUser();
	const updateUserSessionUser = useAppStore((state) => state.updateUserSessionUser);

	return async function setSlideOrientationPreference(
		slideOrientationPreference: SlideOrientationPreferenceType,
	): Promise<void> {
		if (currentUser === undefined) {
			return;
		}

		startTransition(() => {
			updateUserSessionUser({
				slide_orientation_preference: slideOrientationPreference,
			});
		});

		try {
			const savedPreference = await saveSlideOrientationPreference(slideOrientationPreference);
			startTransition(() => {
				updateUserSessionUser({
					slide_orientation_preference: savedPreference,
				});
			});
		} catch (error) {
			console.error("Failed to persist slide orientation preference:", error);
		}
	};
}
