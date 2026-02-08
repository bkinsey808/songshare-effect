/* eslint-disable @typescript-eslint/no-unsafe-type-assertion --
   Centralized store wiring composes dynamically-created slice factories and
   performs runtime validation. Narrowing/casts are localized here for safety
   and readability rather than repeated at each consumer site.
*/
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import type { AppSlice } from "./AppSlice.type";

import omittedPersistKeysSet from "./config/omittedPersistKeysSet";
import sliceFactories from "./config/sliceFactories";
import { hydrationState } from "./hydration";

function isFullAppSlice(obj: unknown): obj is AppSlice {
	if (obj === null || typeof obj !== "object") {
		return false;
	}
	// Use `in` checks to avoid direct member access on potentially untyped objects
	return (
		"setShowSignedInAlert" in obj &&
		"addOrUpdatePrivateSongs" in obj &&
		"fetchPlaylist" in obj &&
		"fetchEventBySlug" in obj
	);
}

/**
 * The singleton app store hook.
 */
const useAppStore = create<AppSlice>()(
	devtools(
		persist(
			(
				set: Set<Partial<AppSlice>, AppSlice>,
				get: Get<Partial<AppSlice>, AppSlice>,
				api: Api<Partial<AppSlice>, AppSlice>,
			): AppSlice => {
				// Compose slices from an ordered array to keep the setup declarative.
				const partials: Partial<AppSlice>[] = sliceFactories.map((factory) =>
					factory(set, get, api),
				);
				let combinedPartial: Partial<AppSlice> = {};
				for (const partial of partials) {
					Object.assign(combinedPartial, partial);
				}

				if (!isFullAppSlice(combinedPartial)) {
					throw new TypeError("Failed to compose app slices");
				}

				return combinedPartial;
			},
			{
				name: "app-store",
				partialize: (state: Readonly<AppSlice>): Partial<AppSlice> => {
					const result: Record<string, unknown> = {};
					// Use Object.keys with a type cast to ensure type-safe iteration.
					// This avoids the Object.entries typing issue where the tuple values
					// can be inferred as `any`.
					for (const key of Object.keys(state) as (keyof AppSlice)[]) {
						if (!omittedPersistKeysSet.has(key as string)) {
							result[key as string] = (state as Record<string, unknown>)[key as string];
						}
					}
					return result as Partial<AppSlice>;
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
 * Typed getter for the vanilla store API
 *
 * Use this when you need a fully-typed `AppSlice` from code that runs
 * outside a selector (tests, hooks, non-react helpers). This centralizes
 * the narrowing/cast so callers don't have to perform `as unknown as AppSlice`
 * themselves.
 */
// The Zustand `getState()` is untyped at this callsite; we assert the shape
// once below using a small runtime check so callers get a fully-typed `AppSlice`
// without repeating unsafe casts across the codebase.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion -- runtime validation of untyped store
function assertAppSlice(state: unknown): asserts state is AppSlice {
	if (state === null || typeof state !== "object") {
		throw new TypeError("App store is not yet initialized or has unexpected shape");
	}
	const maybeObj = state as Record<string, unknown>;
	if (
		typeof maybeObj["setShowSignedInAlert"] !== "function" ||
		typeof maybeObj["addOrUpdatePrivateSongs"] !== "function" ||
		typeof maybeObj["fetchPlaylist"] !== "function"
	) {
		throw new TypeError("App store is not yet initialized or has unexpected shape");
	}
}

export function getTypedState(): AppSlice {
	const state: unknown = useAppStore.getState();
	assertAppSlice(state);
	return state;
}

/**
 * Common alias for useAppStore to satisfy React Compiler rules when
 * accessing the vanilla store API (e.g. getState, subscribe) outside
 * of the hook-oriented usage.
 */
export const appStore = useAppStore;

export default useAppStore;
