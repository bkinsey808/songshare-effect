import { Effect } from "effect";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import type { AppSlice } from "@/react/app-store/AppSlice.type";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import type { RemoveUserFromLibraryRequest, UserLibraryEntry } from "./slice/user-library-types";

/**
 * useUserLibrary
 *
 * Initializes and exposes the current user's library. On mount this hook
 * fetches the library and subscribes to realtime updates; the subscription
 * is automatically torn down on unmount or when the location changes.
 *
 * @returns entries - array of followed user entries
 * @returns isLoading - true while the library is loading
 * @returns error - error message when loading fails, or undefined when ok
 * @returns removeFromUserLibrary - function to remove a user from the library
 */
import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";
import type { SongLibraryEntry } from "@/react/song-library/slice/song-library-types";

export default function useUserLibrary(): {
	entries: UserLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	currentUserId: string | undefined;
	songLibraryEntries: Readonly<Record<string, SongLibraryEntry>>;
	playlistLibraryEntries: Readonly<Record<string, PlaylistLibraryEntry>>;
	removeFromUserLibrary: (
		request: Readonly<RemoveUserFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	const userLibraryEntries = useAppStore<Readonly<Record<string, UserLibraryEntry>>>(
		(state: AppSlice) => state.userLibraryEntries,
	);
	const isLoading = useAppStore<boolean>((state: AppSlice) => state.isUserLibraryLoading);
	const error = useAppStore<string | undefined>((state: AppSlice) => state.userLibraryError);
	const songLibraryEntries = useAppStore<Readonly<Record<string, SongLibraryEntry>>>(
		(state: AppSlice) => state.songLibraryEntries,
	);
	const playlistLibraryEntries = useAppStore<Readonly<Record<string, PlaylistLibraryEntry>>>(
		(state: AppSlice) => state.playlistLibraryEntries,
	);
	const fetchUserLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchUserLibrary,
	);
	const subscribeToUserLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToUserLibrary,
	);
	const subscribeToUserPublicForLibrary = useAppStore<() => Effect.Effect<() => void, Error>>(
		(state: AppSlice) => state.subscribeToUserPublicForLibrary,
	);
	const removeFromUserLibrary = useAppStore<
		(request: Readonly<RemoveUserFromLibraryRequest>) => Effect.Effect<void, Error>
	>((state: AppSlice) => state.removeUserFromLibrary);
	/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

	const currentUserId = useCurrentUserId();

	const location = useLocation();

	useEffect(() => {
		void Effect.runPromise(fetchUserLibrary());

		let unsubscribeUserLibrary: (() => void) | undefined = undefined;
		let unsubscribeUserPublic: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribeUserLibrary = await Effect.runPromise(subscribeToUserLibrary());
				unsubscribeUserPublic = await Effect.runPromise(subscribeToUserPublicForLibrary());
			} catch (error: unknown) {
				console.error("[useUserLibrary] Failed to subscribe:", error);
			}
		})();

		return (): void => {
			if (unsubscribeUserLibrary !== undefined) {
				unsubscribeUserLibrary();
			}
			if (unsubscribeUserPublic !== undefined) {
				unsubscribeUserPublic();
			}
		};
	}, [
		location.pathname,
		fetchUserLibrary,
		subscribeToUserLibrary,
		subscribeToUserPublicForLibrary,
	]);

	const entries = Object.values(userLibraryEntries);

	return {
		entries,
		isLoading,
		error,
		currentUserId,
		songLibraryEntries,
		playlistLibraryEntries,
		removeFromUserLibrary,
	};
}
