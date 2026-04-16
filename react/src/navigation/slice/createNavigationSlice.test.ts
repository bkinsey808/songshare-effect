import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import createNavigationSlice from "./createNavigationSlice";
import type { NavigationSlice } from "./NavigationSlice.type";

/**
 * Returns a minimal mock store with vi.fn() stubs for set, get, and api.
 * Suitable for testing createNavigationSlice without a full Zustand store.
 *
 * @returns An object containing `set`, `get`, and `api` stubs for tests
 */
function makeMockStore(): {
	set: Set<NavigationSlice>;
	get: Get<NavigationSlice>;
	api: Api<NavigationSlice>;
} {
	const set = vi.fn();
	const get = vi.fn();
	const api: Api<NavigationSlice> = {
		setState: set as Set<NavigationSlice>,
		getState: get as Get<NavigationSlice>,
		getInitialState: get as Get<NavigationSlice>,
		subscribe: () => () => undefined,
	};
	return { set: set as Set<NavigationSlice>, get: get as Get<NavigationSlice>, api };
}

describe("createNavigationSlice", () => {
	it("returns initial state with isHeaderActionsExpanded true", () => {
		const { set, get, api } = makeMockStore();

		const slice = createNavigationSlice(set, get, api);

		expect(slice.isHeaderActionsExpanded).toBe(true);
	});

	it("setHeaderActionsExpanded calls set with new value", () => {
		const { set, get, api } = makeMockStore();

		const slice = createNavigationSlice(set, get, api);
		slice.setHeaderActionsExpanded(false);

		expect(set).toHaveBeenCalledWith({ isHeaderActionsExpanded: false });
	});

	it("toggleHeaderActions calls set with updater function", () => {
		const { set, get, api } = makeMockStore();

		const slice = createNavigationSlice(set, get, api);
		slice.toggleHeaderActions();

		expect(set).toHaveBeenCalledWith(expect.any(Function));
	});
});
