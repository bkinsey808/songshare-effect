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
