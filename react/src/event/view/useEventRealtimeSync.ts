import { Effect as EffectRuntime, type Effect } from "effect";
import { useEffect } from "react";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import isRecord from "@/shared/type-guards/isRecord";

type UseEventRealtimeSyncParams = {
	eventSlug: string | undefined;
	eventId: string | undefined;
	currentUserId: string | undefined;
	fetchEventBySlug: (eventSlug: string) => Effect.Effect<void, unknown>;
};

/**
 * Heuristic to determine whether a realtime participant payload should be
 * ignored because it represents an operation performed by the current user.
 *
 * @param payload - realtime event payload
 * @param currentUserId - id of the current user to compare against
 * @returns true when refresh can be skipped for the current user
 */
function shouldSkipParticipantRefresh(
	payload: unknown,
	currentUserId: string | undefined,
): boolean {
	if (currentUserId === undefined || currentUserId === "" || !isRecord(payload)) {
		return false;
	}

	const { eventType } = payload;
	if (eventType !== "INSERT" && eventType !== "DELETE") {
		return false;
	}

	const newRecord = isRecord(payload["new"]) ? payload["new"] : undefined;
	const oldRecord = isRecord(payload["old"]) ? payload["old"] : undefined;
	let payloadUserId: string | undefined = undefined;
	if (typeof newRecord?.["user_id"] === "string") {
		payloadUserId = newRecord["user_id"];
	} else if (typeof oldRecord?.["user_id"] === "string") {
		payloadUserId = oldRecord["user_id"];
	}

	return payloadUserId === currentUserId;
}

/**
 * Keeps event view data synchronized with realtime updates.
 *
 * @param eventSlug - Event slug used for event_public subscription filtering
 * @param eventId - Event id used for event_user subscription filtering
 * @param currentUserId - id of the current user to avoid self-originated refreshes
 * @param fetchEventBySlug - Store action that refreshes event state by slug
 * @returns Nothing; this hook performs side effects only
 */
export default function useEventRealtimeSync({
	eventSlug,
	eventId,
	currentUserId,
	fetchEventBySlug,
}: Readonly<UseEventRealtimeSyncParams>): void {
	// Subscribe to event_public changes and refresh the current event by slug.
	useEffect(() => {
		if (eventSlug === undefined || eventSlug === "") {
			return;
		}

		const slug = eventSlug;
		let cleanup: (() => void) | undefined = undefined;

		/**
		 * Subscribe to `event_public` realtime updates and trigger a fetch
		 * for the current event slug when events occur.
		 *
		 * @returns void
		 */
		async function subscribeToEventPublic(): Promise<void> {
			try {
				const userToken = await getSupabaseAuthToken();
				const client = getSupabaseClient(userToken);
				if (client === undefined) {
					return;
				}

				cleanup = createRealtimeSubscription({
					client,
					tableName: "event_public",
					filter: `event_slug=eq.${slug}`,
					onEvent: () =>
						EffectRuntime.tryPromise({
							try: () => EffectRuntime.runPromise(fetchEventBySlug(slug)),
							catch: (error: unknown) =>
								error instanceof Error ? error : new Error(String(error)),
						}),
				});
			} catch {
				// Read subscriptions are best-effort; initial fetch still drives UI.
			}
		}

		void subscribeToEventPublic();

		return (): void => {
			if (cleanup !== undefined) {
				cleanup();
			}
		};
	}, [eventSlug, fetchEventBySlug]);

	// Subscribe to event_user changes and refresh participants for the current event.
	useEffect(() => {
		if (eventSlug === undefined || eventSlug === "" || eventId === undefined || eventId === "") {
			return;
		}

		const slug = eventSlug;
		const id = eventId;
		const userId = currentUserId;
		let cleanup: (() => void) | undefined = undefined;

				/**
				 * Subscribe to `event_user` realtime updates and refresh
				 * participant lists when relevant events occur.
				 *
				 * @returns void
				 */
				async function subscribeToParticipants(): Promise<void> {
			try {
				const userToken = await getSupabaseAuthToken();
				const client = getSupabaseClient(userToken);
				if (client === undefined) {
					return;
				}

				cleanup = createRealtimeSubscription({
					client,
					tableName: "event_user",
					filter: `event_id=eq.${id}`,
					onEvent: (payload) => {
						if (shouldSkipParticipantRefresh(payload, userId)) {
							return EffectRuntime.void;
						}

						return EffectRuntime.tryPromise({
							try: () => EffectRuntime.runPromise(fetchEventBySlug(slug)),
							catch: (error: unknown) =>
								error instanceof Error ? error : new Error(String(error)),
						});
					},
				});
			} catch {
				// Read subscriptions are best-effort; initial fetch still drives UI.
			}
		}

		void subscribeToParticipants();

		return (): void => {
			if (cleanup !== undefined) {
				cleanup();
			}
		};
	}, [currentUserId, eventId, eventSlug, fetchEventBySlug]);
}
