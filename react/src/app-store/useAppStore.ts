import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { AppSlice } from "./AppSlice.type";

import omittedPersistKeysSet from "./config/omittedPersistKeysSet";
import sliceFactories from "./config/sliceFactories";
import { hydrationState } from "./hydration";

function isFullAppSlice(obj: Partial<AppSlice>): obj is AppSlice {
	return (
		typeof obj.setShowSignedInAlert === "function" &&
		typeof obj.addOrUpdatePrivateSongs === "function" &&
		typeof obj.fetchPlaylist === "function"
	);
}

/**
 * The singleton app store hook.
 */
const useAppStore = create<AppSlice>()(
	devtools(
		persist(
			(set, get, api): AppSlice => {
				// Compose slices from an ordered array to keep the setup declarative.
				const partials = sliceFactories.map((factory) => factory(set, get, api));
				const combinedPartial = partials.reduce<Partial<AppSlice>>(
					(accumulator, partial) => Object.assign(accumulator, partial),
					{},
				);

				if (!isFullAppSlice(combinedPartial)) {
					throw new TypeError("Failed to compose app slices");
				}

				return combinedPartial;
			},
			{
				name: "app-store",
				partialize: (state: Readonly<AppSlice>): Partial<AppSlice> =>
					Object.fromEntries(
						Object.entries(state).filter(([key]) => !omittedPersistKeysSet.has(key)) as [
							string,
							unknown,
						][],
					) as Partial<AppSlice>,
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

export default useAppStore;

/**
 * Common alias for useAppStore to satisfy React Compiler rules when
 * accessing the vanilla store API (e.g. getState, subscribe) outside
 * of the hook-oriented usage.
 */
export const appStore = useAppStore;
