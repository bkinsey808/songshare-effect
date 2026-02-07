import { Effect } from "effect";

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
		if (
			typeof payload !== "object" ||
			payload === null ||
			!("eventType" in payload) ||
			!("new" in payload)
		) {
			return;
		}

		const rec = payload as Record<string, unknown>;
		const { eventType } = rec;
		const newRecord = rec["new"];

		if (eventType === "INSERT" || eventType === "UPDATE") {
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
			const oldRecord = rec["old"];
			if (
				typeof oldRecord === "object" &&
				oldRecord !== null &&
				"event_id" in oldRecord &&
				typeof (oldRecord as Record<string, unknown>)["event_id"] === "string"
			) {
				const eventId = String((oldRecord as Record<string, unknown>)["event_id"]);
				yield* $(
					Effect.sync(() => {
						removeEventLibraryEntry(eventId);
					}),
				);
			}
		}
	});
}
