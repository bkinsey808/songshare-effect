import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type { EventError } from "../event-errors";
import type { EventEntry, EventSliceBase, EventUser, SaveEventRequest } from "../event-types";

import fetchEventBySlugFn from "../fetchEventBySlug";
import joinEventFn from "../joinEvent";
import leaveEventFn from "../leaveEvent";
import saveEventFn from "../saveEvent";
import eventSliceInitialState from "./eventSliceInitialState";

export type EventSlice = EventSliceBase & {
	/** Fetch an event by slug */
	fetchEventBySlug: (eventSlug: string) => Effect.Effect<void, EventError>;
	/** Save an event (create or update) */
	saveEvent: (request: Readonly<SaveEventRequest>) => Effect.Effect<string, EventError>;
	/** Join the current user to an event */
	joinEvent: (eventId: string) => Effect.Effect<void, EventError>;
	/** Leave an event as the given user */
	leaveEvent: (eventId: string, userId: string) => Effect.Effect<void, EventError>;
	/** Clear the current event from state */
	clearCurrentEvent: () => void;
};

/**
 * Factory that creates the Event Zustand slice.
 *
 * This function returns the slice implementation containing public API methods
 * for event management. All CRUD operations go through API endpoints or Supabase
 * direct queries.
 *
 * @param set - Zustand `set` function for updating slice state
 * @param get - Zustand `get` function for reading slice state and helpers
 * @param api - Slice `api` object (unused but kept for consistency with other slices)
 * @returns EventSlice - The initialized slice with public and internal methods
 */
export function createEventSlice(
	set: Set<EventSlice>,
	get: Get<EventSlice>,
	api: Api<EventSlice>,
): EventSlice {
	// silence unused param warnings
	void api;

	sliceResetFns.add(() => {
		set(eventSliceInitialState);
	});

	return {
		...eventSliceInitialState,

		// Public API methods
		fetchEventBySlug: (eventSlug: string) => fetchEventBySlugFn(eventSlug, get),

		saveEvent: (request: Readonly<SaveEventRequest>) => saveEventFn(request, get),

		joinEvent: (eventId: string) => joinEventFn(eventId, get),

		leaveEvent: (eventId: string, userId: string) => leaveEventFn(eventId, userId, get),

		// Internal state management methods
		setCurrentEvent: (event: EventEntry | undefined) => {
			set({ currentEvent: event as ReadonlyDeep<EventEntry> | undefined });
		},

		setEvents: (events: readonly EventEntry[]) => {
			set({ events: events as ReadonlyDeep<readonly EventEntry[]> });
		},

		setParticipants: (participants: readonly EventUser[]) => {
			set({ participants: participants as ReadonlyDeep<readonly EventUser[]> });
		},

		setEventLoading: (loading: boolean) => {
			set({ isEventLoading: loading });
		},

		setEventError: (error: string | undefined) => {
			set({ eventError: error });
		},

		setEventSaving: (saving: boolean) => {
			set({ isEventSaving: saving });
		},

		clearCurrentEvent: () => {
			set({ currentEvent: undefined, eventError: undefined });
		},
	};
}
