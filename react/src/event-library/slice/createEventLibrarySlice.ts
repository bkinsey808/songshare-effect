import { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type {
	AddEventToLibraryRequest,
	EventLibraryEntry,
	EventLibraryState,
	RemoveEventFromLibraryRequest,
} from "../event-library-types";
import type { EventLibrarySlice } from "./EventLibrarySlice.type";

import addEventToLibraryFn from "../event-add/addEventToLibraryEffect";
import removeEventFromLibraryFn from "../event-remove/removeEventFromLibraryEffect";
import fetchEventLibraryFn from "../fetch/fetchEventLibraryEffect";
import subscribeToEventLibraryFn from "../subscribe/subscribeToEventLibraryEffect";

const initialState: EventLibraryState = {
	eventLibraryEntries: {} as Record<string, EventLibraryEntry>,
	isEventLibraryLoading: false,
	eventLibraryError: undefined,
};

/**
 * Factory that creates the Zustand slice for event library state and actions.
 * The returned slice exposes Effects for fetching, subscribing, and mutating
 * the library, as well as local setters used by those Effects.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `EventLibrarySlice`.
 */
export default function createEventLibrarySlice(
	set: Set<EventLibrarySlice>,
	get: Get<EventLibrarySlice>,
	api: Api<EventLibrarySlice>,
): EventLibrarySlice {
	void api;
	sliceResetFns.add(() => {
		const { eventLibraryUnsubscribe } = get();
		if (eventLibraryUnsubscribe) {
			eventLibraryUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		addEventToLibrary: (request: Readonly<AddEventToLibraryRequest>) =>
			addEventToLibraryFn(request, get),
		removeEventFromLibrary: (request: Readonly<RemoveEventFromLibraryRequest>) =>
			removeEventFromLibraryFn(request, get),

		isInEventLibrary: (eventId: string) => {
			const { eventLibraryEntries } = get();
			return eventId in eventLibraryEntries;
		},

		getEventLibraryIds: () => {
			const { eventLibraryEntries } = get();
			return Object.keys(eventLibraryEntries);
		},

		fetchEventLibrary: () => fetchEventLibraryFn(get),

		subscribeToEventLibrary: (): Effect.Effect<() => void, Error> => subscribeToEventLibraryFn(get),

		subscribeToEventPublicForLibrary: (): Effect.Effect<() => void, Error> =>
			Effect.succeed((): void => {
				// No-op for now - can add enrichment later
			}),

		setEventLibraryEntries: (entries: ReadonlyDeep<Record<string, EventLibraryEntry>>) => {
			set({ eventLibraryEntries: entries });
		},

		addEventLibraryEntry: (entry: EventLibraryEntry) => {
			set((state) => ({
				eventLibraryEntries: {
					...state.eventLibraryEntries,
					[entry.event_id]: entry,
				},
			}));
		},

		removeEventLibraryEntry: (eventId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.eventLibraryEntries).filter(([id]) => id !== eventId),
				);
				return { eventLibraryEntries: newEntries };
			});
		},

		setEventLibraryLoading: (loading: boolean) => {
			set({ isEventLibraryLoading: loading });
		},

		setEventLibraryError: (error: string | undefined) => {
			set({ eventLibraryError: error });
		},
	};
}
