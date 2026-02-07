import type { Effect } from "effect";

import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import type {
	AddEventToLibraryRequest,
	EventLibraryEntry,
	EventLibrarySliceBase,
	EventLibraryState,
	RemoveEventFromLibraryRequest,
} from "../event-library-types";

export type EventLibrarySlice = EventLibraryState &
	EventLibrarySliceBase & {
		addEventToLibrary: (request: Readonly<AddEventToLibraryRequest>) => Effect.Effect<void, Error>;
		removeEventFromLibrary: (
			request: Readonly<RemoveEventFromLibraryRequest>,
		) => Effect.Effect<void, Error>;
		getEventLibraryIds: () => string[];
		fetchEventLibrary: () => Effect.Effect<void, Error>;
		subscribeToEventLibrary: () => Effect.Effect<() => void, Error>;
		subscribeToEventPublicForLibrary: () => Effect.Effect<() => void, Error>;
		eventLibraryUnsubscribe?: () => void;
		setEventLibraryEntries: (entries: ReadonlyDeep<Record<string, EventLibraryEntry>>) => void;
		setEventLibraryLoading: (loading: boolean) => void;
		setEventLibraryError: (error: string | undefined) => void;
		addEventLibraryEntry: (entry: EventLibraryEntry) => void;
		removeEventLibraryEntry: (eventId: string) => void;
	};
