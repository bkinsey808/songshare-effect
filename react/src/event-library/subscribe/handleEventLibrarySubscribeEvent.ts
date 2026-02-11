import { Effect } from "effect";

import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import isEventLibraryEntry from "../guards/isEventLibraryEntry";

/**
 * Handles realtime subscription events for the event_library table.
 *
 * @param payload - The realtime event payload
 * @param supabaseClient - Supabase client for enriching entries
 * @param get - Getter for the EventLibrarySlice
 * @returns - An Effect that completes after applying the change
 */
export default function handleEventLibrarySubscribeEvent(
	payload: unknown,
	supabaseClient: unknown,
	get: () => EventLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventLibraryEventGen($) {
		void supabaseClient;

		const { addEventLibraryEntry, removeEventLibraryEntry } = get();

		// Check if payload is a realtime event
		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType } = payload as Record<string, unknown>;

		if (eventType === "INSERT" || eventType === "UPDATE") {
			const newRecord = extractNewRecord(payload);
			if (newRecord === undefined) {
				return;
			}

			if (!isEventLibraryEntry(newRecord)) {
				console.warn("[handleEventLibraryEvent] Invalid entry:", newRecord);
				return;
			}

			yield* $(
				Effect.sync(() => {
					addEventLibraryEntry(newRecord);
				}),
			);
		} else if (eventType === "DELETE") {
			const eventId = extractStringField((payload as Record<string, unknown>)["old"], "event_id");
			if (eventId !== undefined) {
				yield* $(
					Effect.sync(() => {
						removeEventLibraryEntry(eventId);
					}),
				);
			}
		}
	});
}
