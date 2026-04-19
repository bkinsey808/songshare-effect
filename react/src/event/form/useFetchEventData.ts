import { Effect } from "effect";
import { useEffect } from "react";

import type { EventEntry } from "../event-entry/EventEntry.type";
import type { EventError } from "../event-errors";

type UseFetchEventDataParams = {
	readonly eventId: string | undefined;
	readonly isEditing: boolean;
	readonly currentEvent: EventEntry | undefined;
	readonly fetchPlaylistLibrary: () => Effect.Effect<void, Error>;
	readonly fetchEventById: (id: string) => Effect.Effect<void, EventError>;
	readonly setEventError: (error: string | undefined) => void;
};

/**
 * Hook that handles data fetching for the event form.
 *
 * @param eventId - Event id being edited (undefined for new events)
 * @param isEditing - whether we are in edit mode
 * @param currentEvent - persisted event record from store
 * @param fetchPlaylistLibrary - action to load playlists
 * @param fetchEventById - action to load single event
 * @param setEventError - action to update error state
 * @returns void
 */
export default function useFetchEventData({
	eventId,
	isEditing,
	currentEvent,
	fetchPlaylistLibrary,
	fetchEventById,
	setEventError,
}: UseFetchEventDataParams): void {
	// Clears stale event errors when opening the create form.
	useEffect(() => {
		if (!isEditing) {
			setEventError(undefined);
		}
	}, [isEditing, setEventError]);

	// Loads playlist library entries so the active playlist selector has options.
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchPlaylistLibrary());
			} catch (error: unknown) {
				console.error("[useEventForm] Failed to fetch playlist library:", error);
			}
		})();
	}, [fetchPlaylistLibrary]);

	// Ensure edit routes can hydrate when opened directly by id.
	useEffect(() => {
		if (
			!isEditing ||
			eventId === undefined ||
			eventId === "" ||
			(currentEvent !== undefined &&
				currentEvent.event_id === eventId &&
				currentEvent.public !== undefined)
		) {
			return;
		}

		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchEventById(eventId));
			} catch (error: unknown) {
				console.error("[useEventForm] Failed to fetch event by id:", error);
			}
		})();
	}, [currentEvent, eventId, fetchEventById, isEditing]);
}
