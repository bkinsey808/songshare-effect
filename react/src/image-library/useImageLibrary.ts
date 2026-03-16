import { Effect } from "effect";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";

import type { ImageLibraryEntry, RemoveImageFromLibraryRequest } from "./image-library-types";

/**
 * Initializes and exposes the current user's image library. On mount this hook
 * fetches the library and subscribes to realtime updates; the subscription is
 * automatically torn down on unmount or when the location changes.
 *
 * @returns entries - array of image library entries
 * @returns isLoading - true while the library is loading
 * @returns error - error message when loading fails, or undefined when ok
 * @returns removeFromImageLibrary - function to remove an image from the library
 */
export default function useImageLibrary(): {
	entries: ImageLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	removeFromImageLibrary: (
		request: Readonly<RemoveImageFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	const imageLibraryEntries = useAppStore<Readonly<Record<string, ImageLibraryEntry>>>(
		(state: AppSlice) => state.imageLibraryEntries,
	);
	const isLoading = useAppStore<boolean>((state: AppSlice) => state.isImageLibraryLoading);
	const error = useAppStore<string | undefined>((state: AppSlice) => state.imageLibraryError);
	const fetchImageLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchImageLibrary,
	);
	const subscribeToImageLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToImageLibrary,
	);
	const removeFromImageLibrary = useAppStore<
		(request: Readonly<RemoveImageFromLibraryRequest>) => Effect.Effect<void, Error>
	>((state: AppSlice) => state.removeImageFromLibrary);

	const location = useLocation();

	// this useEffect handles fetching the library on mount and
	// subscribing to updates, and ensures subscriptions are
	// cleaned up on unmount or location change
	useEffect(() => {
		void Effect.runPromise(fetchImageLibrary());

		let unsubscribeImageLibrary: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribeImageLibrary = await Effect.runPromise(subscribeToImageLibrary());
			} catch (error: unknown) {
				console.error("[useImageLibrary] Failed to subscribe:", error);
			}
		})();

		return (): void => {
			if (unsubscribeImageLibrary !== undefined) {
				unsubscribeImageLibrary();
			}
		};
	}, [location.pathname, fetchImageLibrary, subscribeToImageLibrary]);

	const entries = Object.values(imageLibraryEntries);

	return {
		entries,
		isLoading,
		error,
		removeFromImageLibrary,
	};
}
