import { Effect } from "effect";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useAppStore } from "@/react/zustand/useAppStore";

import type { RemoveUserFromLibraryRequest, UserLibraryEntry } from "./slice/user-library-types";

/**
 * Hook to initialize and expose User Library state and actions.
 */
export default function useUserLibrary(): {
	entries: UserLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	removeFromUserLibrary: (
		request: Readonly<RemoveUserFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	const userLibraryEntries = useAppStore((state) => state.userLibraryEntries);
	const isLoading = useAppStore((state) => state.isUserLibraryLoading);
	const error = useAppStore((state) => state.userLibraryError);
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);
	const subscribeToUserLibrary = useAppStore((state) => state.subscribeToUserLibrary);
	const removeFromUserLibrary = useAppStore((state) => state.removeUserFromLibrary);

	const location = useLocation();

	useEffect(() => {
		void Effect.runPromise(fetchUserLibrary());

		let unsubscribe: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribe = await Effect.runPromise(subscribeToUserLibrary());
			} catch (error: unknown) {
				console.error("[useUserLibrary] Failed to subscribe to user library:", error);
			}
		})();

		return (): void => {
			if (unsubscribe !== undefined) {
				unsubscribe();
			}
		};
	}, [location.pathname, fetchUserLibrary, subscribeToUserLibrary]);

	const entries = Object.values(userLibraryEntries);

	return { entries, isLoading, error, removeFromUserLibrary };
}
