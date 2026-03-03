import { Effect } from "effect";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { EventLibraryEntry } from "../event-library-types";
import type { EventLibrarySlice } from "./EventLibrarySlice.type";

/**
 * Returns a getter for a minimal, test-friendly `EventLibrarySlice`.
 * The returned getter exposes stateful behavior for `setEventLibraryEntries`,
 * `addEventLibraryEntry`, and `removeEventLibraryEntry` so tests can assert
 * against `slice.eventLibraryEntries` after actions run.
 */
export default function makeEventLibrarySlice(
	initialEntries: Record<string, EventLibraryEntry> = {},
): () => EventLibrarySlice {
	const state = {
		eventLibraryEntries: initialEntries,
		isEventLibraryLoading: false,
		eventLibraryError: undefined as string | undefined,
	};

	const setEventLibraryEntries = vi.fn((entries: Record<string, EventLibraryEntry>) => {
		state.eventLibraryEntries = entries;
	});

	const setEventLibraryLoading = vi.fn((loading: boolean) => {
		state.isEventLibraryLoading = loading;
	});

	const setEventLibraryError = vi.fn((err?: string) => {
		state.eventLibraryError = err;
	});

	const addEventLibraryEntry = vi.fn((entry: EventLibraryEntry) => {
		state.eventLibraryEntries = { ...state.eventLibraryEntries, [entry.event_id]: entry };
	});

	const removeEventLibraryEntry = vi.fn((id: string) => {
		const { [id]: _removed, ...rest } = state.eventLibraryEntries;
		state.eventLibraryEntries = rest as Record<string, EventLibraryEntry>;
	});

	const stub = {
		get eventLibraryEntries(): Record<string, EventLibraryEntry> {
			return state.eventLibraryEntries;
		},
		get isEventLibraryLoading(): boolean {
			return state.isEventLibraryLoading;
		},
		get eventLibraryError(): string | undefined {
			return state.eventLibraryError;
		},

		addEventToLibrary: (_req: unknown): unknown => ({}),
		removeEventFromLibrary: (_req: unknown): unknown => ({}),
		isInEventLibrary: (id: string): boolean => id in state.eventLibraryEntries,
		getEventLibraryIds: (): string[] => Object.keys(state.eventLibraryEntries),
		fetchEventLibrary: (): unknown => Effect.sync(() => undefined),
		subscribeToEventLibrary: (): unknown => Effect.sync(() => (): void => undefined),
		subscribeToEventPublicForLibrary: (): unknown => Effect.sync(() => (): void => undefined),
		setEventLibraryEntries,
		setEventLibraryLoading,
		setEventLibraryError,
		addEventLibraryEntry,
		removeEventLibraryEntry,
	};

	return () => forceCast<EventLibrarySlice>(stub);
}
