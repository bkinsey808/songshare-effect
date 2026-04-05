import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import isRecord from "@/shared/type-guards/isRecord";
import { coerceChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { coerceChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { coerceChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";
import { coerceSlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { coerceSlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

/**
 * Keeps the signed-in user's profile and preference fields synchronized from Supabase realtime
 * updates.
 *
 * @returns void
 */
export default function useCurrentUserRealtimeSync(): void {
	const currentUser = useCurrentUser();
	const updateUserSessionUser = useAppStore((state) => state.updateUserSessionUser);
	const updateUserSessionUserPublic = useAppStore((state) => state.updateUserSessionUserPublic);
	const currentUserId = currentUser?.userId;

	// Keep the signed-in user's private/public profile fields in sync across tabs.
	useEffect(() => {
		if (currentUserId === undefined) {
			return;
		}

		let cleanupUser: (() => void) | undefined = undefined;
		let cleanupUserPublic: (() => void) | undefined = undefined;
		let isCancelled = false;

		void (async (): Promise<void> => {
			const userToken = await getSupabaseAuthToken();
			if (userToken === undefined || isCancelled) {
				return;
			}

			const client = getSupabaseClient(userToken);
			if (client === undefined || isCancelled) {
				return;
			}

			cleanupUser = createRealtimeSubscription({
				client,
				tableName: "user",
				filter: `user_id=eq.${currentUserId}`,
				onEvent: (payload) =>
					Effect.sync(() => {
						if (
							!isRecord(payload) ||
							payload["eventType"] !== "UPDATE" ||
							!isRecord(payload["new"])
						) {
							return;
						}

						const nextSlideOrientation = payload["new"]["slide_orientation_preference"];
						if (typeof nextSlideOrientation === "string") {
							updateUserSessionUser({
								slide_orientation_preference:
									coerceSlideOrientationPreference(nextSlideOrientation),
							});
						}

						const nextChordDisplayCategory = payload["new"]["chord_display_category"];
						if (typeof nextChordDisplayCategory === "string") {
							updateUserSessionUser({
								chord_display_category: coerceChordDisplayCategory(nextChordDisplayCategory),
							});
						}

						const nextChordLetterDisplay = payload["new"]["chord_letter_display"];
						if (typeof nextChordLetterDisplay === "string") {
							updateUserSessionUser({
								chord_letter_display: coerceChordLetterDisplay(nextChordLetterDisplay),
							});
						}

						const nextChordScaleDegreeDisplay = payload["new"]["chord_scale_degree_display"];
						if (typeof nextChordScaleDegreeDisplay === "string") {
							updateUserSessionUser({
								chord_scale_degree_display: coerceChordScaleDegreeDisplay(
									nextChordScaleDegreeDisplay,
								),
							});
						}

						const nextSlideNumber = payload["new"]["slide_number_preference"];
						if (typeof nextSlideNumber === "string") {
							updateUserSessionUser({
								slide_number_preference: coerceSlideNumberPreference(nextSlideNumber),
							});
						}
					}),
			});

			cleanupUserPublic = createRealtimeSubscription({
				client,
				tableName: "user_public",
				filter: `user_id=eq.${currentUserId}`,
				onEvent: (payload) =>
					Effect.sync(() => {
						if (
							!isRecord(payload) ||
							payload["eventType"] !== "UPDATE" ||
							!isRecord(payload["new"])
						) {
							return;
						}

						const nextUsername = payload["new"]["username"];
						if (typeof nextUsername === "string") {
							updateUserSessionUserPublic({
								username: nextUsername,
							});
						}
					}),
			});
		})();

		return (): void => {
			isCancelled = true;
			cleanupUser?.();
			cleanupUserPublic?.();
		};
	}, [currentUserId, updateUserSessionUser, updateUserSessionUserPublic]);
}
