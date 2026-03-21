import { Effect } from "effect";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";

/**
 * Initializes and exposes the current user's tag library. On mount this hook
 * fetches the library and subscribes to realtime updates; the subscription is
 * automatically torn down on unmount or when the location changes.
 *
 * @returns slugs - sorted array of tag slugs in the library
 * @returns isLoading - true while the library is loading
 * @returns error - error message when loading fails, or undefined when ok
 */
export default function useTagLibrary(): {
	slugs: string[];
	isLoading: boolean;
	error: string | undefined;
} {
	const tagLibraryEntries = useAppStore((state: AppSlice) => state.tagLibraryEntries);
	const isLoading = useAppStore<boolean>((state: AppSlice) => state.isTagLibraryLoading);
	const error = useAppStore<string | undefined>((state: AppSlice) => state.tagLibraryError);
	const fetchTagLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchTagLibrary,
	);
	const subscribeToTagLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToTagLibrary,
	);

	const location = useLocation();

	// Fetch the tag library on mount and subscribe to realtime updates.
	// Subscription is torn down on unmount or location change.
	useEffect(() => {
		void Effect.runPromise(fetchTagLibrary());

		let unsubscribeTagLibrary: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribeTagLibrary = await Effect.runPromise(subscribeToTagLibrary());
			} catch (error: unknown) {
				console.error("[useTagLibrary] Failed to subscribe:", error);
			}
		})();

		return (): void => {
			if (unsubscribeTagLibrary !== undefined) {
				unsubscribeTagLibrary();
			}
		};
	}, [location.pathname, fetchTagLibrary, subscribeToTagLibrary]);

	const slugs = Object.keys(tagLibraryEntries).toSorted();

	return { slugs, isLoading, error };
}
