import { Effect } from "effect";

import type { EventPublic } from "@/react/event/event-types";
import type { RealtimePayload } from "@/react/lib/supabase/subscription/subscription-types";

import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import type { EventLibraryEntry } from "../event-library-types";
import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

/**
 * Handles realtime subscription events for the event_public table.
 * checks if the updated event is in the current library, and updates it if so.
 *
 * @param payload - The realtime event payload
 * @param get - Getter for the EventLibrarySlice
 * @returns - An Effect that completes after applying the change
 */
export default function handleEventPublicSubscribeEvent(
	payload: unknown,
	get: () => EventLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventPublicEventGen($) {
		const { eventLibraryEntries, addEventLibraryEntry } = get();

		// Check if payload is a realtime event
		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType } = payload;

		if (eventType === "UPDATE") {
			// Cast safely because guard passed, but extractNewRecord needs specific type
			// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
			const newRecord = extractNewRecord(payload as RealtimePayload<EventPublic>);
			if (newRecord === undefined) {
				return;
			}

			const { event_id: eventId } = newRecord;
			const existingEntry = eventLibraryEntries[eventId];

			// Only update if we have this event in our library
			if (existingEntry && existingEntry.event_public) {
				const { owner } = existingEntry.event_public;
				const updatedEntry: EventLibraryEntry = {
					...existingEntry,
					event_public: {
						...existingEntry.event_public,
						...newRecord,
						...(owner ? { owner } : {}),
					},
				};

				yield* $(
					Effect.sync(() => {
						addEventLibraryEntry(updatedEntry);
					}),
				);
			}
		}
	});
}
