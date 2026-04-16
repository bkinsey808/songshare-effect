import { startTransition } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import type { SlideNumberPreferenceType } from "@/shared/user/slideNumberPreference";

import saveSlideNumberPreference from "./saveSlideNumberPreference";

/**
 * Hook returning a function that updates the user's slide number preference
 * in local state and persists it to the server.
 *
 * @returns Function accepting a `SlideNumberPreferenceType` and returning a Promise<void>
 */
export default function useSetSlideNumberPreference(): (
	slideNumberPreference: SlideNumberPreferenceType,
) => Promise<void> {
	const currentUser = useCurrentUser();
	const updateUserSessionUser = useAppStore((state) => state.updateUserSessionUser);

	return async function setSlideNumberPreference(
		slideNumberPreference: SlideNumberPreferenceType,
	): Promise<void> {
		if (currentUser === undefined) {
			return;
		}

		startTransition(() => {
			updateUserSessionUser({
				slide_number_preference: slideNumberPreference,
			});
		});

		try {
			const savedPreference = await saveSlideNumberPreference(slideNumberPreference);
			startTransition(() => {
				updateUserSessionUser({
					slide_number_preference: savedPreference,
				});
			});
		} catch (error) {
			console.error("Failed to persist slide number preference:", error);
		}
	};
}
