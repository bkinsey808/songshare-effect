import { Effect } from "effect";
import { useEffect, useRef } from "react";

import useAppStore from "@/react/app-store/useAppStore";

/**
 * Eagerly fetches the current user's library once when the user is signed in.
 *
 * This ensures UserSearchInput components on public pages (song view, community
 * manage, event manage, etc.) have library entries available without requiring
 * a prior visit to UserLibraryPage.
 *
 * @returns void
 */
export default function useInitUserLibrary(): void {
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);
	const isSignedIn = useAppStore((state) => state.isSignedIn);
	const isUserLibraryLoading = useAppStore((state) => state.isUserLibraryLoading);

	const initialized = useRef(false);

	// Fetch user library once the user is authenticated, if not already loading
	useEffect(() => {
		if (initialized.current || isSignedIn !== true || isUserLibraryLoading) {
			return;
		}
		initialized.current = true;
		void Effect.runPromise(fetchUserLibrary());
	}, [fetchUserLibrary, isSignedIn, isUserLibraryLoading]);
}
