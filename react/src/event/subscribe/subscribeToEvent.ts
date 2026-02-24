import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import type { Get } from "@/react/app-store/app-store-types";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsSupabaseRealtimeClientLike from "@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike";
import { type RealtimePayload } from "@/react/lib/supabase/subscription/subscription-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import isRecord from "@/shared/type-guards/isRecord";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type { EventParticipant } from "../event-entry/EventEntry.type";

import { type EventEntry, type EventPublic, type EventUser } from "../event-types";
import { isEventUser } from "../guards/guardEventTypes";
import { type EventSlice } from "../slice/EventSlice.type";

/**
 * Creates and manages Supabase Realtime subscriptions for the current event.
 *
 * This function handles:
 * 1. `event_public`: Updates to event details (metadata, playback state).
 * 2. `event_user`: Updates to the participants list (join, leave, status changes).
 * 3. `user_public`: Real-time username updates for participants and owner.
 *
 * @param set - Zustand `set` function for the EventSlice
 * @param get - Zustand `get` function for the EventSlice
 * @returns A higher-order function that returns a cleanup function to remove the realtime channels.
 */
export default function subscribeToEvent(
	set: (
		partial:
			| Partial<ReadonlyDeep<EventSlice>>
			| ((state: ReadonlyDeep<EventSlice>) => Partial<ReadonlyDeep<EventSlice>>),
	) => void,
	get: Get<EventSlice>,
): () => (() => void) | undefined {
	return (): (() => void) | undefined => {
		const { currentEvent } = get();
		if (currentEvent === undefined) {
			return undefined;
		}

		const eventId = currentEvent.event_id;
		let unsubscribeFn: (() => void) | undefined = undefined;

		void (async (): Promise<void> => {
			try {
				const client = await getSupabaseClientWithAuth();

				if (client === undefined) {
					console.error("❌ [subscribeToEvent] Supabase client is undefined");
					return;
				}

				const realtimeClient = guardAsSupabaseRealtimeClientLike(client);
				if (realtimeClient === undefined) {
					console.error("❌ [subscribeToEvent] Realtime client is undefined");
					return;
				}

				const channelName = `event_${eventId}_${Date.now()}`;
				const channel = realtimeClient.channel(channelName);
				channel.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "event_public",
						filter: `event_id=eq.${eventId}`,
					},
					(payloadObj: unknown): void => {
						const payload = forceCast<RealtimePayload<Partial<EventPublic>>>(payloadObj);

						// Supabase realtime sometimes delivers only the updated columns instead of
						// the full row. The strict `isEventPublic` guard previously used would
						// reject those partial payloads, meaning listeners would never see
						// playback-only changes (e.g. active_song_id, active_slide_position).
						//
						// To ensure the manager view stays in sync across tabs we accept any
						// object payload and merge whatever fields are present. The filter on
						// the channel guarantees the `event_id` matches the current event.
						if (
							payload.eventType === "UPDATE" &&
							payload.new !== undefined &&
							payload.new !== null &&
							typeof payload.new === "object"
						) {
							const newData = forceCast<Partial<EventPublic>>(payload.new);
							set((state) => {
								if (state.currentEvent === undefined || state.currentEvent.event_id !== eventId) {
									return state;
								}
								// Build new event object by merging the partial update into
								// the existing public data. We intentionally avoid spreading
								// over `state.currentEvent` directly to keep linter happy.
								const nextCurrentEvent: EventEntry = {
									...state.currentEvent,
									public: forceCast<EventPublic>({ ...state.currentEvent.public, ...newData }),
								};
								return forceCast<Partial<ReadonlyDeep<EventSlice>>>({
									currentEvent: forceCast<ReadonlyDeep<EventEntry>>(nextCurrentEvent),
								});
							});
						}
					},
				);

				// participant updates subscription
				channel.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "event_user",
						filter: `event_id=eq.${eventId}`,
					},
					(payloadObj: unknown): void => {
						const payload = forceCast<RealtimePayload<EventUser>>(payloadObj);
						const { eventType, new: newItem, old: oldItem } = payload;
						set((state) => {
							if (state.currentEvent === undefined || state.currentEvent.event_id !== eventId) {
								return state;
							}
							const currentParticipants = forceCast<EventParticipant[]>(
								state.currentEvent.participants ?? [],
							);
							let nextParticipants: EventParticipant[] = [];

							if (
								eventType === "INSERT" &&
								newItem !== undefined &&
								newItem !== null &&
								isEventUser(newItem)
							) {
								nextParticipants = [...currentParticipants];
								if (
									!nextParticipants.some((participant) => participant.user_id === newItem.user_id)
								) {
									nextParticipants.push(forceCast<EventParticipant>(newItem));
								}
							} else if (
								eventType === "UPDATE" &&
								newItem !== undefined &&
								newItem !== null &&
								isEventUser(newItem)
							) {
								const updatedUser = newItem;
								for (const participant of currentParticipants) {
									if (participant.user_id === updatedUser.user_id) {
										nextParticipants.push({ ...participant, ...updatedUser });
									} else {
										nextParticipants.push(participant);
									}
								}
							} else if (
								eventType === "DELETE" &&
								oldItem !== undefined &&
								oldItem !== null &&
								isRecord(oldItem)
							) {
								const deletedUserId = (oldItem as Record<string, unknown>)["user_id"];
								if (typeof deletedUserId === "string") {
									nextParticipants = currentParticipants.filter(
										(participant) => participant.user_id !== deletedUserId,
									);
								} else {
									nextParticipants = [...currentParticipants];
								}
							} else {
								nextParticipants = [...currentParticipants];
							}

							const nextCurrentEvent: EventEntry = {
								...state.currentEvent,
								participants: nextParticipants,
							};
							const partial: Partial<ReadonlyDeep<EventSlice>> = {
								currentEvent: forceCast<ReadonlyDeep<EventEntry>>(nextCurrentEvent),
								participants: forceCast<ReadonlyDeep<EventUser[]>>(nextParticipants),
							};
							return partial;
						});
					},
				);

				channel.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "user_public",
					},
					(payloadObj: unknown): void => {
						const payload = forceCast<
							RealtimePayload<{
								user_id: string;
								username: string;
							}>
						>(payloadObj);
						if (
							payload.eventType === "UPDATE" &&
							payload.new !== undefined &&
							payload.new !== null &&
							isRecord(payload.new)
						) {
							const { user_id: userId, username } = forceCast<{
								user_id: string;
								username: string;
							}>(payload.new);
							set((state) => {
								if (state.currentEvent === undefined || state.currentEvent.event_id !== eventId) {
									return state;
								}
								const currentParticipants = forceCast<EventParticipant[]>(
									state.currentEvent.participants ?? [],
								);
								const isOwner = state.currentEvent.owner_id === userId;
								if (
									!isOwner &&
									!currentParticipants.some((participant) => participant.user_id === userId)
								) {
									return state;
								}

								const nextParticipants: EventParticipant[] = [];
								for (const participant of currentParticipants) {
									if (participant.user_id === userId) {
										nextParticipants.push({ ...participant, username });
									} else {
										nextParticipants.push(participant);
									}
								}

								const nextCurrentEvent: EventEntry = {
									...state.currentEvent,
									participants: nextParticipants,
									...(isOwner ? { owner_username: username } : {}),
								};
								const partial: Partial<ReadonlyDeep<EventSlice>> = {
									currentEvent: forceCast<ReadonlyDeep<EventEntry>>(nextCurrentEvent),
								};
								return partial;
							});
						}
					},
				);

				console.warn(
					"📡 [subscribeToEvent] All listeners attached, about to call channel.subscribe()",
				);

				// Add error listener to catch Realtime errors (only log actual errors, not ok status)
				channel.on("system", { event: "error" }, (payload: unknown) => {
					if (isRecord(payload) && payload["status"] !== "ok") {
						console.error("❌ [subscribeToEvent] Realtime channel error:", payload);
					}
				});

				channel.subscribe((status: string, subscribeError: unknown) => {
					if (status !== (REALTIME_SUBSCRIBE_STATES.SUBSCRIBED as string)) {
						console.warn("⚠️ Realtime subscription status:", status, "for event:", eventId);
						if (subscribeError !== undefined && subscribeError !== null) {
							console.error("❌ Realtime subscription error for event:", eventId, subscribeError);
						}
					}
				});

				unsubscribeFn = (): void => {
					if (realtimeClient !== undefined) {
						realtimeClient.removeChannel(channel);
					}
				};
			} catch (setupError) {
				console.error("❌ [subscribeToEvent] Setup error for event:", eventId, setupError);
			}
		})();

		return () => {
			if (unsubscribeFn !== undefined) {
				unsubscribeFn();
			}
		};
	};
}
