import { Effect } from "effect";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";

import type { TagItemCounts } from "./fetch/TagItemCounts.type";

/**
 * Initializes and exposes the current user's tag library. On mount this hook
 * fetches the library, per-item-type counts, and subscribes to realtime
 * updates; the subscription is automatically torn down on unmount or when the
 * location changes.
 *
 * @returns slugs - sorted array of tag slugs in the library
 * @returns counts - per-item-type counts keyed by tag slug
 * @returns isLoading - true while the library is loading
 * @returns error - error message when loading fails, or undefined when ok
 */
export default function useTagLibrary(): {
	slugs: string[];
	counts: Record<string, TagItemCounts>;
	isLoading: boolean;
	error: string | undefined;
} {
	const tagLibraryEntries = useAppStore((state: AppSlice) => state.tagLibraryEntries);
	const counts = useAppStore((state: AppSlice) => state.tagLibraryCounts);
	const isLoading = useAppStore<boolean>((state: AppSlice) => state.isTagLibraryLoading);
	const error = useAppStore<string | undefined>((state: AppSlice) => state.tagLibraryError);
	const fetchTagLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchTagLibrary,
	);
	const fetchTagLibraryCounts = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchTagLibraryCounts,
	);
	const subscribeToTagLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToTagLibrary,
	);
	const subscribeToTagCounts = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToTagCounts,
	);

	const location = useLocation();

	// Fetch the tag library on mount and subscribe to realtime updates.
	// Subscriptions are torn down on unmount or location change.
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchTagLibrary());
				await Effect.runPromise(fetchTagLibraryCounts());
			} catch (error: unknown) {
				console.error("[useTagLibrary] Failed to fetch:", error);
			}
		})();

		let unsubscribeTagLibrary: (() => void) | undefined = undefined;
		let unsubscribeTagCounts: (() => void) | undefined = undefined;

		void (async (): Promise<void> => {
			try {
				unsubscribeTagLibrary = await Effect.runPromise(subscribeToTagLibrary());
			} catch (error: unknown) {
				console.error("[useTagLibrary] Failed to subscribe to tag library:", error);
			}
		})();

		void (async (): Promise<void> => {
			try {
				unsubscribeTagCounts = await Effect.runPromise(subscribeToTagCounts());
			} catch (error: unknown) {
				console.error("[useTagLibrary] Failed to subscribe to tag counts:", error);
			}
		})();

		return (): void => {
			unsubscribeTagLibrary?.();
			unsubscribeTagCounts?.();
		};
	}, [
		location.pathname,
		fetchTagLibrary,
		fetchTagLibraryCounts,
		subscribeToTagLibrary,
		subscribeToTagCounts,
	]);

	const slugs = Object.keys(tagLibraryEntries).toSorted();

	return { slugs, counts, isLoading, error };
}
