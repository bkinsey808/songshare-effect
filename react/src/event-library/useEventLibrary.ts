import { Effect } from "effect";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import type { AppSlice } from "@/react/app-store/AppSlice.type";

import useAppStore from "@/react/app-store/useAppStore";

import type { EventLibraryEntry, RemoveEventFromLibraryRequest } from "./event-library-types";

/**
 * Initializes and exposes the current user's event library. On mount this hook
 * fetches the library and subscribes to realtime updates; the subscription
 * is automatically torn down on unmount or when the location changes.
 *
 * @returns entries - array of event library entries
 * @returns isLoading - true while the library is loading
 * @returns error - error message when loading fails, or undefined when ok
 * @returns removeFromEventLibrary - function to remove an event from the library
 */
export default function useEventLibrary(): {
	entries: EventLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	removeFromEventLibrary: (
		request: Readonly<RemoveEventFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	const eventLibraryEntries = useAppStore<Readonly<Record<string, EventLibraryEntry>>>(
		(state: AppSlice) => state.eventLibraryEntries,
	);
	const isLoading = useAppStore<boolean>((state: AppSlice) => state.isEventLibraryLoading);
	const error = useAppStore<string | undefined>((state: AppSlice) => state.eventLibraryError);
	const fetchEventLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchEventLibrary,
	);
	const subscribeToEventLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToEventLibrary,
	);
	const subscribeToEventPublicForLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToEventPublicForLibrary,
	);
	const removeFromEventLibrary = useAppStore<
		(request: Readonly<RemoveEventFromLibraryRequest>) => Effect.Effect<void, Error>
	>((state: AppSlice) => state.removeEventFromLibrary);

	const location = useLocation();

	// this useEffect handles fetching the library on mount and
	// subscribing to updates, and ensures subscriptions are
	// cleaned up on unmount or location change
	useEffect(() => {
		void Effect.runPromise(fetchEventLibrary());

		let unsubscribeEventLibrary: (() => void) | undefined = undefined;
		let unsubscribeEventPublic: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribeEventLibrary = await Effect.runPromise(subscribeToEventLibrary());
				unsubscribeEventPublic = await Effect.runPromise(subscribeToEventPublicForLibrary());
			} catch (error: unknown) {
				console.error("[useEventLibrary] Failed to subscribe:", error);
			}
		})();

		return (): void => {
			if (unsubscribeEventLibrary !== undefined) {
				unsubscribeEventLibrary();
			}
			if (unsubscribeEventPublic !== undefined) {
				unsubscribeEventPublic();
			}
		};
	}, [
		location.pathname,
		fetchEventLibrary,
		subscribeToEventLibrary,
		subscribeToEventPublicForLibrary,
	]);

	const entries = Object.values(eventLibraryEntries);

	return {
		entries,
		isLoading,
		error,
		removeFromEventLibrary,
	};
}
