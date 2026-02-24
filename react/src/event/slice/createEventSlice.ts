import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type { EventEntry, EventState, EventUser, SaveEventRequest } from "../event-types";
import type { EventSlice } from "./EventSlice.type";

import fetchEventBySlugFn from "../fetch/fetchEventBySlug";
import saveEventFn from "../form/saveEvent";
import joinEventFn from "../join/joinEvent";
import leaveEventFn from "../leave/leaveEvent";
import subscribeToEventFn from "../subscribe/subscribeToEvent";

const eventSliceInitialState: EventState = {
	currentEvent: undefined,
	events: [],
	participants: [],
	isEventLoading: false,
	eventError: undefined,
	isEventSaving: false,
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
export default function createEventSlice(
	set: Set<EventSlice>,
	get: Get<EventSlice>,
	api: Api<EventSlice>,
): EventSlice {
	// silence unused param warnings
	void api;

	sliceResetFns.add(() => {
		const state = get();
		if (state.activeEventUnsubscribe !== undefined) {
			state.activeEventUnsubscribe();
		}
		set(eventSliceInitialState);
	});

	return {
		...eventSliceInitialState,

		// Public API methods
		fetchEventBySlug: (eventSlug: string) => fetchEventBySlugFn(eventSlug, get),

		saveEvent: (request: Readonly<SaveEventRequest>) => saveEventFn(request, get),

		joinEvent: (eventId: string) => joinEventFn(eventId, get),

		leaveEvent: (eventId: string, userId: string) => leaveEventFn(eventId, userId, get),

		subscribeToEvent: () => {
			const state = get();
			// Unsubscribe from previous if exists
			if (state.activeEventUnsubscribe !== undefined) {
				state.activeEventUnsubscribe();
			}

			// Cast set to the type expected by subscribeToEventFn
			const typedSet = set as (
				partial:
					| Partial<ReadonlyDeep<EventSlice>>
					| ((state: ReadonlyDeep<EventSlice>) => Partial<ReadonlyDeep<EventSlice>>),
			) => void;

			const unsubscribe = subscribeToEventFn(typedSet, get)();
			set({ activeEventUnsubscribe: unsubscribe ?? undefined });
			return unsubscribe;
		},

		// Internal state management methods
		setCurrentEvent: (event: EventEntry | undefined) => {
			set({ currentEvent: event as ReadonlyDeep<EventEntry> | undefined });
		},

		setEvents: (events: readonly EventEntry[]) => {
			set({ events: events as ReadonlyDeep<readonly EventEntry[]> });
		},

		setParticipants: (participants: readonly EventUser[]) => {
			set({ participants: participants as ReadonlyDeep<EventUser[]> });
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
			const state = get();
			if (state.activeEventUnsubscribe !== undefined) {
				state.activeEventUnsubscribe();
			}
			set({
				currentEvent: undefined,
				eventError: undefined,
				activeEventUnsubscribe: undefined,
			});
		},
	};
}
