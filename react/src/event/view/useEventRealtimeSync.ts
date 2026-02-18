import { Effect as EffectRuntime, type Effect } from "effect";
import { useEffect } from "react";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

type UseEventRealtimeSyncParams = {
	eventSlug: string | undefined;
	eventId: string | undefined;
	fetchEventBySlug: (eventSlug: string) => Effect.Effect<void, unknown>;
};

/**
 * Keeps event view data synchronized with realtime updates.
 *
 * @param eventSlug - Event slug used for event_public subscription filtering
 * @param eventId - Event id used for event_user subscription filtering
 * @param fetchEventBySlug - Store action that refreshes event state by slug
 * @returns Nothing; this hook performs side effects only
 */
export default function useEventRealtimeSync({
	eventSlug,
	eventId,
	fetchEventBySlug,
}: Readonly<UseEventRealtimeSyncParams>): void {
	// Subscribe to event_public changes and refresh the current event by slug.
	useEffect(() => {
		if (eventSlug === undefined || eventSlug === "") {
			return;
		}

		const slug = eventSlug;
		let cleanup: (() => void) | undefined = undefined;

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
		let cleanup: (() => void) | undefined = undefined;

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

		void subscribeToParticipants();

		return (): void => {
			if (cleanup !== undefined) {
				cleanup();
			}
		};
	}, [eventId, eventSlug, fetchEventBySlug]);
}
