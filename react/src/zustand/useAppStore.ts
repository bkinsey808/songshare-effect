// src/features/app-store/useAppStore.ts
import { useEffect, useState } from "react";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { type AuthSlice, createAuthSlice } from "@/react/auth/auth-slice";
import useSchedule from "@/react/hooks/useSchedule";
import {
	type SongLibrarySlice,
	createSongLibrarySlice,
} from "@/react/song-library/slice/song-library-slice";
import {
	type SongSubscribeSlice,
	createSongSubscribeSlice,
} from "@/react/song/song-view/song-slice";
import { clientWarn } from "@/react/utils/clientLogger";

import { resetAllSlices, sliceResetFns } from "./slice-reset-fns";

// sliceResetFns & resetAllSlices live in a dedicated module to avoid
// circular imports between slices and the root store.

// NOTE: exports are added at the end of the file.

// Compose new slices here
type AppSlice = AuthSlice & SongSubscribeSlice & SongLibrarySlice;

// Keys that should NOT be persisted to storage. Keep transient UI flags
// (like `showSignedInAlert`) out of persisted state so rehydration does
// not overwrite short-lived values set during navigation flows.
//
// Use a runtime `Set<string>` here so persistence filtering can compare
// the string keys returned by `Object.entries` without needing unsafe
// type assertions. The set's values intentionally mirror the AppSlice keys.
const omittedKeys: Set<string> = new Set<string>([
	"showSignedInAlert",
	"activePrivateSongsUnsubscribe",
	"activePublicSongsUnsubscribe",
	"songLibraryUnsubscribe",
]);

let store: UseBoundStore<StoreApi<AppSlice>> | undefined = undefined;

// Track hydration state externally (not polluting business state)
const hydrationState = {
	isHydrated: false,
	listeners: new Set<() => void>(),
	// The ideal solution: provide a direct promise
	promise: undefined as Promise<void> | undefined,
	resolvePromise: undefined as (() => void) | undefined,
};

function useAppStore(): UseBoundStore<StoreApi<AppSlice>> {
	return getOrCreateAppStore();
}

// Typed selector helper for components to select typed values from the store.
// This wraps the internal `useAppStore()` call and provides a generic selector
// while keeping the localized `any` casts contained in this file.
function useAppStoreSelector<Selected>(selector: (slice: AppSlice) => Selected): Selected {
	return useAppStore()(selector);
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
function getOrCreateAppStore(): UseBoundStore<StoreApi<AppSlice>> {
	if (store === undefined) {
		// Create the hydration promise before creating the store
		if (!hydrationState.promise) {
			// The deferred promise is intentional here — callers will await hydration.
			// oxlint-disable-next-line no-new-promises
			// oxlint-disable-next-line promise/avoid-new
			hydrationState.promise = new Promise<void>((resolve) => {
				hydrationState.resolvePromise = resolve;
			});
		}

		store = create<AppSlice>()(
			devtools(
				persist(
					(set, get, api): AppSlice => ({
						...createAuthSlice(set, get, api),
						...createSongSubscribeSlice(set, get, api),
						...createSongLibrarySlice(set, get, api),
					}),
					{
						name: "app-store",

						// The partialize step extracts a subset of state for
						// persistence. Narrow the assertion to `Partial<AppSlice>`
						// and keep the unsafe cast localized to the check where
						// we compare string keys to the typed `omittedKeys`.
						// Create a small, typed partialization routine that
						// avoids blanket `Object.entries(... ) as ...` assertions
						// and doesn't rely on inline unsafe type assertions.
						// Return state entries excluding `omittedKeys` as a Partial<AppSlice>
						// Build a plain object from the current state and exclude
						// the transient keys we don't want persisted. We avoid
						// casting string keys to `keyof AppSlice` and therefore
						// prevent unsafe assertions in the filter step.
						partialize: (state: Readonly<AppSlice>): Partial<AppSlice> =>
							// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
							Object.fromEntries(
								Object.entries(state).filter(([key]) => !omittedKeys.has(key)),
							) as Partial<AppSlice>,
						// Clean hydration callback that doesn't pollute business state
						onRehydrateStorage: (): (() => void) => () => {
							// Update external hydration state
							hydrationState.isHydrated = true;
							// Resolve the hydration promise (ideal solution!)
							if (hydrationState.resolvePromise) {
								hydrationState.resolvePromise();
								hydrationState.resolvePromise = undefined;
							}
							// Notify all listeners
							for (const listener of hydrationState.listeners) {
								listener();
							}
						},
					},
				),
				{
					enabled:
						import.meta !== undefined &&
						import.meta.env !== undefined &&
						Boolean(import.meta.env["VITE_DEVTOOLS"]),
					name: "AppStore",
				},
			),
		);
	}
	return store;
}

// Backwards-compatible alias for callers that still import `ensureAppStore`.
// Prefer `getOrCreateAppStore` for new code.
const ensureAppStore: typeof getOrCreateAppStore = getOrCreateAppStore;

// Non-hook accessor for the bound store API. Returns the underlying
// bound store instance if it exists; otherwise returns undefined. This
// avoids calling hooks from non-hook code and lets callers read the
// store API safely when the store has been created.
function getStoreApi(): UseBoundStore<StoreApi<AppSlice>> | undefined {
	return store;
}

// React Compiler compatible hydration hook - clean approach
function useAppStoreHydrated(): {
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
			clientWarn("[useAppStoreHydrated] already hydrated, scheduling setIsHydrated(true)");
			schedule(() => {
				setIsHydrated(true);
			});
			return;
		}

		// Listen for hydration completion
		function listener(): void {
			schedule(() => {
				setIsHydrated(true);
			});
		}

		hydrationState.listeners.add(listener);
		// Debug
		clientWarn(
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
function useAppStoreHydrationPromise(): Promise<void> {
	// Avoid calling any React hooks here to keep hook call order stable
	// during Suspense. Ensure the hydration promise exists so callers can
	// throw it for Suspense to catch. The actual store creation (which
	// may also create the promise) happens in useAppStore(), but we can
	// lazily create the promise here if it doesn't exist yet.
	if (hydrationState.isHydrated) {
		return Promise.resolve();
	}

	if (!hydrationState.promise) {
		// oxlint-disable-next-line no-new-promises
		// oxlint-disable-next-line promise/avoid-new
		hydrationState.promise = new Promise<void>((resolve) => {
			hydrationState.resolvePromise = resolve;
		});
	}

	return hydrationState.promise;
}

// Re-export public API at end of file to satisfy export ordering lint rule
export {
	ensureAppStore,
	getOrCreateAppStore,
	getStoreApi,
	resetAllSlices,
	sliceResetFns,
	useAppStore,
	useAppStoreHydrated,
	useAppStoreHydrationPromise,
	useAppStoreSelector,
};

export type { AppSlice };
