import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import type { Get } from "@/react/app-store/app-store-types";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsSupabaseRealtimeClientLike from "@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike";
import { type RealtimePayload } from "@/react/lib/supabase/subscription/subscription-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import isRecord from "@/shared/type-guards/isRecord";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

import type { EventParticipant } from "../event-entry/EventEntry.type";

import { type EventEntry, type EventPublic, type EventUser } from "../event-types";
import { isEventPublic, isEventUser } from "../guards/guardEventTypes";
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
				const realtimeClient = guardAsSupabaseRealtimeClientLike(client);
				if (realtimeClient === undefined) {
					return;
				}

				const channel = realtimeClient.channel(`event_${eventId}_${Date.now()}`);

				channel.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "event_public",
						filter: `event_id=eq.${eventId}`,
					},
					(payloadObj: unknown): void => {
						const payload = forceCast<RealtimePayload<EventPublic>>(payloadObj);
						if (
							payload.eventType === "UPDATE" &&
							payload.new !== undefined &&
							payload.new !== null &&
							isEventPublic(payload.new)
						) {
							const newData = payload.new;
							set((state) => {
								if (state.currentEvent === undefined || state.currentEvent.event_id !== eventId) {
									return state;
								}
								// Build new event object without spread in a way that avoids lint issues if possible,
								// though spread on local objects is usually fine.
								const nextCurrentEvent: EventEntry = {
									...state.currentEvent,
									public: { ...state.currentEvent.public, ...newData },
								};
								return forceCast<Partial<ReadonlyDeep<EventSlice>>>({
									currentEvent: forceCast<ReadonlyDeep<EventEntry>>(nextCurrentEvent),
								});
							});
						}
					},
				);

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
								const deletedUserId = oldItem["user_id"];
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
						filter: "",
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

				channel.subscribe((status: string, subscribeError: unknown) => {
					if (status === (REALTIME_SUBSCRIBE_STATES.SUBSCRIBED as string)) {
						console.warn("Subscribed", eventId);
					} else if (subscribeError !== undefined && subscribeError !== null) {
						console.error("Sub error", eventId, subscribeError);
					}
				});

				unsubscribeFn = (): void => {
					if (realtimeClient !== undefined) {
						realtimeClient.removeChannel(channel);
					}
				};
			} catch (setupError) {
				console.error("Sub setup error", setupError);
			}
		})();
		return () => {
			if (unsubscribeFn !== undefined) {
				unsubscribeFn();
			}
		};
	};
}
