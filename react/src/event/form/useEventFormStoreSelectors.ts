import { type Effect } from "effect";

import useAppStore from "@/react/app-store/useAppStore";
import type { EventEntry } from "@/react/event/event-entry/EventEntry.type";
import type { EventError } from "@/react/event/event-errors";
import type { SaveEventRequest } from "@/react/event/event-types";
import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

type UseEventFormStoreSelectorsReturn = {
	readonly storeIsLoading: boolean;
	readonly isSaving: boolean;
	readonly storeError: string | undefined;
	readonly setEventError: (error: string | undefined) => void;
	readonly fetchPlaylistLibrary: () => Effect.Effect<void, Error>;
	readonly playlistLibraryEntries: ReadonlyDeep<Record<string, PlaylistLibraryEntry>>;
	readonly isPlaylistLibraryLoading: boolean;
	readonly saveEvent: (request: SaveEventRequest) => Effect.Effect<string, EventError>;
	readonly currentEvent: EventEntry | undefined;
	readonly fetchEventById: (id: string) => Effect.Effect<void, EventError>;
};

/**
 * Hook that provides selectors and actions for the event form from the global app store.
 *
 * @returns Object containing event-related state and actions
 */
export default function useEventFormStoreSelectors(): UseEventFormStoreSelectorsReturn {
	const storeIsLoading = useAppStore((state) => state.isEventLoading);
	const isSaving = useAppStore((state) => state.isEventSaving);
	const storeError = useAppStore((state) => state.eventError);
	const setEventError = useAppStore((state) => state.setEventError);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const isPlaylistLibraryLoading = useAppStore((state) => state.isPlaylistLibraryLoading);
	const saveEvent = useAppStore((state) => state.saveEvent);
	const currentEvent = useAppStore((state) => state.currentEvent);
	const fetchEventById = useAppStore((state) => state.fetchEventById);

	return {
		storeIsLoading,
		isSaving,
		storeError,
		setEventError,
		fetchPlaylistLibrary,
		playlistLibraryEntries,
		isPlaylistLibraryLoading,
		saveEvent,
		currentEvent,
		fetchEventById,
	};
}
