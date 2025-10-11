// src/features/app-store/useAppStore.ts
import { useEffect, useState } from "react";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import useSchedule from "../hooks/useSchedule";

export const sliceResetFns: Set<() => void> = new Set<() => void>();
export const resetAllSlices = (): void => {
	// eslint-disable-next-line sonarjs/no-empty-collection
	sliceResetFns.forEach((resetFn) => {
		resetFn();
	});
};

// When ready, replace with slice composition pattern:
// export type AppSlice = AuthSlice & UserSubscribeSlice & SongSubscribeSlice & SupabaseSlice;

// For now, empty object until slices are implemented
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AppSlice = {};

const omittedKeys: (keyof AppSlice)[] = [];

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
					(): AppSlice => ({
						// Initialize your actual app state here
						// No hasHydrated needed
					}),
					{
						name: "app-store",
						partialize: (state: AppSlice) => {
							return Object.fromEntries(
								Object.entries(state).filter(
									// eslint-disable-next-line sonarjs/no-empty-collection
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
			schedule(() => setIsHydrated(true));
			return;
		}

		// Listen for hydration completion
		const listener = (): void => {
			schedule(() => setIsHydrated(true));
		};

		hydrationState.listeners.add(listener);

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
	// Ensure store is created (which creates the promise)
	useAppStore();

	// If already hydrated, return resolved promise
	if (hydrationState.isHydrated) {
		return Promise.resolve();
	}

	// Return the hydration promise
	return hydrationState.promise || Promise.resolve();
}
