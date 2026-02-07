import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type { NavigationSlice } from "./NavigationSlice.type";

/**
 * Create the navigation slice containing header action state and mutators.
 *
 * @param set - Zustand `set` function used to update slice state.
 * @param _get - Zustand `get` function (unused, kept for parity with slice API).
 * @param _api - Slice API helpers (unused, reserved for future use).
 * @returns - Initialized `NavigationSlice` with state and action functions.
 */
export default function createNavigationSlice(
	set: Set<NavigationSlice>,
	_get: Get<NavigationSlice>,
	_api: Api<NavigationSlice>,
): NavigationSlice {
	sliceResetFns.add(() => {
		// Reset to default expanded state
		set({ isHeaderActionsExpanded: true });
	});

	return {
		isHeaderActionsExpanded: true,
		setHeaderActionsExpanded: (expanded: boolean) => {
			set({ isHeaderActionsExpanded: expanded });
		},
		toggleHeaderActions: () => {
			set((state) => ({ isHeaderActionsExpanded: !state.isHeaderActionsExpanded }));
		},
	};
}
