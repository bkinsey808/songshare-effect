import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import isRecord from "@/shared/type-guards/isRecord";
import { coerceSlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

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

						const nextPreference = payload["new"]["slide_orientation_preference"];
						if (typeof nextPreference === "string") {
							updateUserSessionUser({
								slide_orientation_preference: coerceSlideOrientationPreference(nextPreference),
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
