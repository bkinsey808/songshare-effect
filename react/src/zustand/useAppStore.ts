// src/features/app-store/useAppStore.ts
import { useEffect, useState } from "react";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const sliceResetFns: Set<() => void> = new Set<() => void>();
export const resetAllSlices = (): void => {
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
};

export function useAppStore(): UseBoundStore<StoreApi<AppSlice>> {
	if (store === undefined) {
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
									([key]) => !omittedKeys.includes(key as keyof AppSlice),
								),
							) as AppSlice;
						},
						// Clean hydration callback that doesn't pollute business state
						onRehydrateStorage: () => () => {
							// Update external hydration state
							hydrationState.isHydrated = true;
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
	const [isHydrated, setIsHydrated] = useState(hydrationState.isHydrated);

	useEffect(() => {
		// If already hydrated, set state immediately
		if (hydrationState.isHydrated) {
			setIsHydrated(true);
			return;
		}

		// Listen for hydration completion
		const listener = (): void => {
			setIsHydrated(true);
		};

		hydrationState.listeners.add(listener);

		// Cleanup listener on unmount
		return (): void => {
			hydrationState.listeners.delete(listener);
		};
	}, []);

	return {
		store: appStore,
		isHydrated,
	};
}
