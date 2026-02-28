import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsSupabaseRealtimeClientLike from "@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike";
import isRecord from "@/shared/type-guards/isRecord";

import type {
	InvitationSlice,
	PendingCommunityInvitation,
	PendingEventInvitation,
} from "./slice/InvitationSlice.type";

/**
 * Creates Supabase Realtime subscriptions for pending community and event
 * invitations for the current user.
 *
 * Listens to INSERT/UPDATE/DELETE events on:
 * - `community_user` filtered to `user_id = currentUserId`
 * - `event_user` filtered to `user_id = currentUserId`
 *
 * @param currentUserId - the signed-in user's ID to filter events by
 * @param get - accessor for the invitation slice helpers
 * @returns cleanup function to remove the channel subscription
 */
export default function subscribeToPendingInvitations(
	currentUserId: string,
	get: () => InvitationSlice,
): () => void {
	let unsubscribeFn: (() => void) | undefined = undefined;

	void (async (): Promise<void> => {
		try {
			const client = await getSupabaseClientWithAuth();
			if (client === undefined) {
				console.error("❌ [subscribeToPendingInvitations] Supabase client is undefined");
				return;
			}

			const realtimeClient = guardAsSupabaseRealtimeClientLike(client);
			if (realtimeClient === undefined) {
				console.error("❌ [subscribeToPendingInvitations] Realtime client is undefined");
				return;
			}

			const channelName = `invitations_${currentUserId}_${Date.now()}`;
			const channel = realtimeClient.channel(channelName);

			// Subscribe to community_user changes for this user
			channel.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "community_user",
					filter: `user_id=eq.${currentUserId}`,
				},
				(payloadObj: unknown): void => {
					if (!isRecord(payloadObj)) {
						return;
					}
					const { eventType } = payloadObj;
					const newData = payloadObj["new"];
					const oldData = payloadObj["old"];

					const { pendingCommunityInvitations, setPendingCommunityInvitations } = get();

					if (
						(eventType === "INSERT" || eventType === "UPDATE") &&
						isRecord(newData) &&
						newData["status"] === "invited" &&
						typeof newData["community_id"] === "string"
					) {
						const communityId: string = newData["community_id"];
						// Only add if not already in the list
						const exists = pendingCommunityInvitations.some(
							(inv) => inv.community_id === communityId,
						);
						if (!exists) {
							// We don't have name/slug from the realtime payload — add a placeholder.
							// The full fetchPendingInvitations seeds the data on mount.
							const newInv: PendingCommunityInvitation = {
								community_id: communityId,
								community_name: communityId,
								community_slug: communityId,
							};
							setPendingCommunityInvitations([...pendingCommunityInvitations, newInv]);
						}
					} else if (
						eventType === "UPDATE" &&
						isRecord(newData) &&
						newData["status"] !== "invited" &&
						typeof newData["community_id"] === "string"
					) {
						// Status changed away from invited — remove unless user already accepted
						const communityId: string = newData["community_id"];
						const updated = pendingCommunityInvitations.filter(
							(inv) => inv.community_id !== communityId || inv.accepted === true,
						);
						setPendingCommunityInvitations(updated);
					} else if (
						eventType === "DELETE" &&
						isRecord(oldData) &&
						typeof oldData["community_id"] === "string"
					) {
						const communityId: string = oldData["community_id"];
						const updated = pendingCommunityInvitations.filter(
							(inv) => inv.community_id !== communityId,
						);
						setPendingCommunityInvitations(updated);
					}
				},
			);

			// Subscribe to event_user changes for this user
			channel.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "event_user",
					filter: `user_id=eq.${currentUserId}`,
				},
				(payloadObj: unknown): void => {
					if (!isRecord(payloadObj)) {
						return;
					}
					const { eventType } = payloadObj;
					const newData = payloadObj["new"];
					const oldData = payloadObj["old"];

					const { pendingEventInvitations, setPendingEventInvitations } = get();

					if (
						(eventType === "INSERT" || eventType === "UPDATE") &&
						isRecord(newData) &&
						newData["status"] === "invited" &&
						typeof newData["event_id"] === "string"
					) {
						const eventId: string = newData["event_id"];
						const exists = pendingEventInvitations.some((inv) => inv.event_id === eventId);
						if (!exists) {
							const newInv: PendingEventInvitation = {
								event_id: eventId,
								event_name: eventId,
								event_slug: eventId,
							};
							setPendingEventInvitations([...pendingEventInvitations, newInv]);
						}
					} else if (
						eventType === "UPDATE" &&
						isRecord(newData) &&
						newData["status"] !== "invited" &&
						typeof newData["event_id"] === "string"
					) {
						const eventId: string = newData["event_id"];
						const updated = pendingEventInvitations.filter(
							(inv) => inv.event_id !== eventId || inv.accepted === true,
						);
						setPendingEventInvitations(updated);
					} else if (
						eventType === "DELETE" &&
						isRecord(oldData) &&
						typeof oldData["event_id"] === "string"
					) {
						const eventId: string = oldData["event_id"];
						const updated = pendingEventInvitations.filter((inv) => inv.event_id !== eventId);
						setPendingEventInvitations(updated);
					}
				},
			);

			channel.on("system", { event: "error" }, (payload: unknown) => {
				if (isRecord(payload) && payload["status"] !== "ok") {
					console.error("❌ [subscribeToPendingInvitations] Realtime channel error:", payload);
				}
			});

			channel.subscribe((status: string, subscribeError: unknown) => {
				if (status !== (REALTIME_SUBSCRIBE_STATES.SUBSCRIBED as string)) {
					console.warn("⚠️ [subscribeToPendingInvitations] Realtime subscription status:", status);
					if (subscribeError !== undefined && subscribeError !== null) {
						console.error(
							"❌ [subscribeToPendingInvitations] Realtime subscription error:",
							subscribeError,
						);
					}
				}
			});

			unsubscribeFn = (): void => {
				realtimeClient.removeChannel(channel);
			};
		} catch (setupError) {
			console.error("❌ [subscribeToPendingInvitations] Setup error:", setupError);
		}
	})();

	return (): void => {
		if (unsubscribeFn !== undefined) {
			unsubscribeFn();
		}
	};
}
