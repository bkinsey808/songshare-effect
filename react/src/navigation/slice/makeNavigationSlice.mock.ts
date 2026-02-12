import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { NavigationSlice } from "./NavigationSlice.type";

/**
 * Return a getter for a minimal, test-friendly NavigationSlice.
 * The getter returns a live stub whose methods mutate internal state so
 * tests can assert against the returned object reference.
 */
export default function makeNavigationSlice(initialExpanded = true): () => NavigationSlice {
	const state = {
		isHeaderActionsExpanded: initialExpanded,
	};

	const setHeaderActionsExpanded = vi.fn((value: boolean) => {
		state.isHeaderActionsExpanded = value;
	});

	const toggleHeaderActions = vi.fn(() => {
		state.isHeaderActionsExpanded = !state.isHeaderActionsExpanded;
	});

	const stub: unknown = {
		get isHeaderActionsExpanded() {
			return state.isHeaderActionsExpanded;
		},
		setHeaderActionsExpanded,
		toggleHeaderActions,
	};

	return () => forceCast<NavigationSlice>(stub);
}
