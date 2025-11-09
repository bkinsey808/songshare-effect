// src/features/app-store/useAppStore.ts
import { useEffect, useState } from "react";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { type AuthSlice, createAuthSlice } from "@/react/auth/authSlice";
import useSchedule from "@/react/hooks/useSchedule";
import {
	type SongSubscribeSlice,
	createSongSubscribeSlice,
} from "@/react/song/song-view/songSlice";

export const sliceResetFns: Set<() => void> = new Set<() => void>();
export const resetAllSlices = (): void => {
	// eslint-disable-next-line sonarjs/no-empty-collection
	sliceResetFns.forEach((resetFn) => {
		resetFn();
	});
};

// Compose new slices here
export type AppSlice = AuthSlice & SongSubscribeSlice;

// Keys that should NOT be persisted to storage. Keep transient UI flags
// (like `showSignedInAlert`) out of persisted state so rehydration does
// not overwrite short-lived values set during navigation flows.
const omittedKeys: (keyof AppSlice)[] = [
	"showSignedInAlert",
	"activePrivateSongsUnsubscribe",
	"activePublicSongsUnsubscribe",
];

let store: UseBoundStore<StoreApi<AppSlice>> | undefined;

// Track hydration state externally (not polluting business state)
const hydrationState = {
	isHydrated: false,
	listeners: new Set<() => void>(),
	// The ideal solution: provide a direct promise
	promise: undefined as Promise<void> | undefined,
	resolvePromise: undefined as (() => void) | undefined,
};

export function useAppStore(): UseBoundStore<StoreApi<AppSlice>> {
	return getOrCreateAppStore();
}

/**
 * Return the singleton app store, creating it if necessary.
 *
 * This is a non-hook accessor (its name does not start with `use`), so it
 * is safe to call from non-React or plain functions — linters won't treat
 * it as a React hook. Inside React components prefer `useAppStore()`.
 *
 * @returns The bound Zustand store for application state.
 */
export function getOrCreateAppStore(): UseBoundStore<StoreApi<AppSlice>> {
	if (store === undefined) {
		// Create the hydration promise before creating the store
		if (!hydrationState.promise) {
			hydrationState.promise = new Promise<void>((resolve) => {
				hydrationState.resolvePromise = resolve;
			});
		}

		store = create<AppSlice>()(
			devtools(
				persist(
					(...args): AppSlice => {
						const [set, get, api] = args;
						return {
							...createAuthSlice(set, get, api),
							...createSongSubscribeSlice(set, get, api),
						};
					},
					{
						name: "app-store",
						partialize: (state: Readonly<AppSlice>) => {
							return Object.fromEntries(
								Object.entries(state).filter(
									([key]) => !omittedKeys.includes(key as keyof AppSlice),
								),
							) as AppSlice;
						},
						// Clean hydration callback that doesn't pollute business state
						onRehydrateStorage: () => () => {
							// Update external hydration state
							hydrationState.isHydrated = true;
							// Resolve the hydration promise (ideal solution!)
							if (hydrationState.resolvePromise) {
								hydrationState.resolvePromise();
								hydrationState.resolvePromise = undefined;
							}
							// Notify all listeners
							hydrationState.listeners.forEach((listener) => listener());
						},
					},
				),
				{
					enabled:
						typeof import.meta !== "undefined" &&
						typeof import.meta.env !== "undefined" &&
						Boolean(import.meta.env["VITE_DEVTOOLS"]),
					name: "AppStore",
				},
			),
		);
	}
	return store as UseBoundStore<StoreApi<AppSlice>>;
}

// Backwards-compatible alias for callers that still import `ensureAppStore`.
// Prefer `getOrCreateAppStore` for new code.
export const ensureAppStore: typeof getOrCreateAppStore = getOrCreateAppStore;

// Non-hook accessor for the bound store API. Returns the underlying
// bound store instance if it exists; otherwise returns undefined. This
// avoids calling hooks from non-hook code and lets callers read the
// store API safely when the store has been created.
export function getStoreApi(): UseBoundStore<StoreApi<AppSlice>> | undefined {
	return store;
}

// React Compiler compatible hydration hook - clean approach
export function useAppStoreHydrated(): {
	store: UseBoundStore<StoreApi<AppSlice>>;
	isHydrated: boolean;
} {
	const appStore = useAppStore();
	// Hook to schedule async state updates (microtask) and avoid
	// updating after unmount.
	const schedule = useSchedule();
	const [isHydrated, setIsHydrated] = useState(hydrationState.isHydrated);

	useEffect(() => {
		// If already hydrated, schedule setting state asynchronously
		if (hydrationState.isHydrated) {
			// Debug
			// eslint-disable-next-line no-console
			console.debug(
				"[useAppStoreHydrated] already hydrated, scheduling setIsHydrated(true)",
			);
			schedule(() => setIsHydrated(true));
			return;
		}

		// Listen for hydration completion
		const listener = (): void => {
			schedule(() => setIsHydrated(true));
		};

		hydrationState.listeners.add(listener);
		// Debug
		// eslint-disable-next-line no-console
		console.debug(
			"[useAppStoreHydrated] added hydration listener; current isHydrated=",
			hydrationState.isHydrated,
		);

		// Cleanup listener on unmount
		return (): void => {
			hydrationState.listeners.delete(listener);
		};
	}, [schedule]);

	return {
		store: appStore,
		isHydrated,
	};
}

// ✅ IDEAL SOLUTION: Hook that returns the hydration promise directly
export function useAppStoreHydrationPromise(): Promise<void> {
	// Avoid calling any React hooks here to keep hook call order stable
	// during Suspense. Ensure the hydration promise exists so callers can
	// throw it for Suspense to catch. The actual store creation (which
	// may also create the promise) happens in useAppStore(), but we can
	// lazily create the promise here if it doesn't exist yet.
	if (hydrationState.isHydrated) {
		return Promise.resolve();
	}

	if (!hydrationState.promise) {
		hydrationState.promise = new Promise<void>((resolve) => {
			hydrationState.resolvePromise = resolve;
		});
	}

	return hydrationState.promise;
}
