import type { Api, Get, Set } from "@/react/zustand/slice-utils";

import { sliceResetFns } from "@/react/zustand/slice-reset-fns";

export type NavigationSlice = {
	/** Whether the header actions area is expanded (persisted) */
	isHeaderActionsExpanded: boolean;

	/** Set the header actions expanded state */
	setHeaderActionsExpanded: (expanded: boolean) => void;
	/** Toggle the header actions expanded state */
	toggleHeaderActions: () => void;
};

/**
 * Create the navigation slice containing header action state and mutators.
 *
 * @param set - Zustand `set` function used to update slice state.
 * @param _get - Zustand `get` function (unused, kept for parity with slice API).
 * @param _api - Slice API helpers (unused, reserved for future use).
 * @returns - Initialized `NavigationSlice` with state and action functions.
 */
export function createNavigationSlice(
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
