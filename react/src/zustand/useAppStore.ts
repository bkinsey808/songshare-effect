// src/features/app-store/useAppStore.ts
import { useEffect, useState } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { type NavigationSlice, createNavigationSlice } from "@/react/navigation/navigation-slice";

import { type AuthSlice, createAuthSlice } from "@/react/auth/auth-slice";
import useSchedule from "@/react/hooks/useSchedule";
import {
	type PlaylistLibrarySlice,
	createPlaylistLibrarySlice,
} from "@/react/playlist-library/slice/playlist-library-slice";
import { type PlaylistSlice, createPlaylistSlice } from "@/react/playlist/slice/playlist-slice";
import {
	type SongLibrarySlice,
	createSongLibrarySlice,
} from "@/react/song-library/slice/song-library-slice";
import {
	type SongSubscribeSlice,
	createSongSubscribeSlice,
} from "@/react/song/song-slice/song-slice";

import { resetAllSlices, sliceResetFns } from "./slice-reset-fns";

// Compose slices
type AppSlice = AuthSlice &
	SongSubscribeSlice &
	SongLibrarySlice &
	PlaylistSlice &
	PlaylistLibrarySlice &
	NavigationSlice;

// Track hydration state externally
const hydrationState = {
	isHydrated: false,
	listeners: new Set<() => void>(),
	promise: undefined as Promise<void> | undefined,
	resolvePromise: undefined as (() => void) | undefined,
};

// Initialize hydration promise safely
if (typeof Promise !== "undefined") {
	// oxlint-disable-next-line promise/avoid-new
	hydrationState.promise = new Promise<void>((resolve) => {
		hydrationState.resolvePromise = resolve;
	});
}

/**
 * The singleton app store hook.
 */
export const useAppStore = create<AppSlice>()(
	devtools(
		persist(
			(set, get, api): AppSlice => ({
				...createAuthSlice(set, get, api),
				...createSongSubscribeSlice(set, get, api),
				...createSongLibrarySlice(set, get, api),
				...createPlaylistSlice(set, get, api),
				...createPlaylistLibrarySlice(set, get, api),
				...createNavigationSlice(set, get, api),
			}),
			{
				name: "app-store",
				partialize: (state: Readonly<AppSlice>): Partial<AppSlice> => {
					const omittedKeys = new Set([
						"showSignedInAlert",
						"activePrivateSongsUnsubscribe",
						"activePublicSongsUnsubscribe",
						"songLibraryUnsubscribe",
						"playlistLibraryUnsubscribe",
						"playlistLibraryPublicUnsubscribe",
					]);
					return Object.fromEntries(
						Object.entries(state).filter(([key]) => !omittedKeys.has(key)),
					) as Partial<AppSlice>;
				},
				onRehydrateStorage: (): (() => void) => () => {
					hydrationState.isHydrated = true;
					if (hydrationState.resolvePromise) {
						hydrationState.resolvePromise();
						hydrationState.resolvePromise = undefined;
					}
					for (const listener of hydrationState.listeners) {
						listener();
					}
				},
			},
		),
		{
			enabled: true, // Let devtools decide internally based on environment
			name: "AppStore",
		},
	),
);

/**
 * Legacy selector helper.
 */
export function useAppStoreSelector<Selected>(selector: (slice: AppSlice) => Selected): Selected {
	return useAppStore(selector);
}

/**
 * Non-hook accessors for the store API.
 */
export function getStoreApi(): typeof useAppStore {
	return useAppStore;
}
export function getOrCreateAppStore(): typeof useAppStore {
	return useAppStore;
}
export function ensureAppStore(): typeof useAppStore {
	return useAppStore;
}

/**
 * Hook to track hydration state.
 */
export function useAppStoreHydrated(): {
	isHydrated: boolean;
} {
	const schedule = useSchedule();
	const [isHydrated, setIsHydrated] = useState(hydrationState.isHydrated);

	useEffect(() => {
		if (hydrationState.isHydrated) {
			schedule(() => {
				setIsHydrated(true);
			});
			return;
		}
		function listener(): void {
			schedule(() => {
				setIsHydrated(true);
			});
		}
		hydrationState.listeners.add(listener);
		return (): void => {
			hydrationState.listeners.delete(listener);
		};
	}, [schedule]);

	return {
		isHydrated,
	};
}

/**
 * Helper to await hydration.
 */
export async function useAppStoreHydrationPromise(): Promise<void> {
	if (hydrationState.isHydrated) {
		return;
	}
	await (hydrationState.promise ?? Promise.resolve());
}

export { resetAllSlices, sliceResetFns };
export type { AppSlice };
