import type { Schema } from "effect";

import type {
    Event,
    EventInsert,
    EventPublic,
    EventPublicInsert,
    EventUser,
} from "@/shared/generated/supabaseSchemas";

import type { EventEntry } from "./event-entry/EventEntry.type";
import type eventFormSchema from "./form/eventFormSchema";

// Re-export generated types
export type { Event, EventEntry, EventInsert, EventPublic, EventPublicInsert, EventUser };

/**
 * Request payload to save an event (create or update).
 */
export type SaveEventRequest = {
	event_id?: string;
	event_name?: string;
	event_slug?: string;
	event_description?: string;
	event_date?: string;
	is_public?: boolean;
	active_playlist_id?: string | null;
	active_song_id?: string | null;
	active_slide_position?: number | null;
	public_notes?: string;
	private_notes?: string;
};

/**
 * A community that an event belongs to, with denormalized name/slug.
 */
export type EventCommunityEntry = {
	community_id: string;
	event_id: string;
	created_at: string;
	community_name?: string;
	community_slug?: string;
};

/**
 * State for a single event being viewed/edited.
 */
export type EventState = {
	currentEvent: EventEntry | undefined;
	events: readonly EventEntry[];
	participants: readonly EventUser[];
	eventCommunities: readonly EventCommunityEntry[];
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
	setEventCommunities: (communities: readonly EventCommunityEntry[]) => void;
	addEventCommunity: (community: EventCommunityEntry) => void;
	removeEventCommunity: (communityId: string) => void;
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
