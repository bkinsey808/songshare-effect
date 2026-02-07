/**
 * Event library types
 *
 * Type definitions used by the Event Library slice and helpers. These types
 * mirror the database schema for `event_library` and related event data.
 */

import type { EventEntry } from "@/react/event/event-types";

export type EventLibrary = {
	user_id: string;
	event_id: string;
	event_owner_id: string;
	created_at: string;
};

export type EventLibraryEntry = EventLibrary & {
	event?: EventEntry;
};

export type AddEventToLibraryRequest = {
	event_id: string;
};

export type RemoveEventFromLibraryRequest = {
	event_id: string;
};

export type EventLibraryState = {
	eventLibraryEntries: Record<string, EventLibraryEntry>;
	isEventLibraryLoading: boolean;
	eventLibraryError?: string | undefined;
};

export type EventLibrarySliceBase = {
	isInEventLibrary: (eventId: string) => boolean;
};
