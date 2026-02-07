import type { Schema } from "effect";

import type {
	Event,
	EventInsert,
	EventPublic,
	EventPublicInsert,
	EventUser,
} from "@/shared/generated/supabaseSchemas";

import type eventFormSchema from "./eventFormSchema";

// Re-export generated types
export type { Event, EventInsert, EventPublic, EventPublicInsert, EventUser };

/**
 * Extended event type for UI with combined data.
 */
export type EventEntry = Event & {
	/** Public event data */
	public?: EventPublic;
	/** Event participants with roles */
	participants?: readonly EventUser[];
	/** Username of the event owner */
	owner_username?: string;
};

/**
 * Request payload to save an event (create or update).
 */
export type SaveEventRequest = {
	event_id?: string;
	event_name: string;
	event_slug: string;
	event_description?: string;
	event_date?: string;
	is_public?: boolean;
	active_playlist_id?: string | null;
	active_song_id?: string | null;
	active_slide_id?: string | null;
	public_notes?: string;
	private_notes?: string;
};

/**
 * State for a single event being viewed/edited.
 */
export type EventState = {
	currentEvent: EventEntry | undefined;
	events: readonly EventEntry[];
	participants: readonly EventUser[];
	isEventLoading: boolean;
	eventError: string | undefined;
	isEventSaving: boolean;
};

/**
 * Base slice type for events (state only).
 */
export type EventSliceBase = EventState & {
	setCurrentEvent: (event: EventEntry | undefined) => void;
	setEvents: (events: readonly EventEntry[]) => void;
	setParticipants: (participants: readonly EventUser[]) => void;
	setEventLoading: (loading: boolean) => void;
	setEventError: (error: string | undefined) => void;
	setEventSaving: (saving: boolean) => void;
};

/**
 * Error types for event operations.
 */
export type EventError =
	| "validation" // Invalid form input
	| "not_found" // Event not found
	| "unauthorized" // User not allowed to access/modify
	| "database" // Database operation failed
	| "network" // Network request failed
	| "unknown"; // Unknown error

export type EventErrors = readonly EventError[];
export type EventFormValues = Schema.Schema.Type<typeof eventFormSchema>;
export type EventFormValuesFromSchema = EventFormValues;
