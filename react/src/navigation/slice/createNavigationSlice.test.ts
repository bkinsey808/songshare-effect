import { expect, it, describe } from "vitest";

import type { Set, Get, Api } from "@/react/app-store/app-store-types";

import { resetAllSlices, sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type { NavigationSlice } from "./NavigationSlice.type";

import createNavigationSlice from "./createNavigationSlice";

function makeStore(): {
	set: Set<NavigationSlice>;
	get: Get<NavigationSlice>;
	stateRef: () => NavigationSlice;
	api: Api<NavigationSlice>;
} {
	let state: NavigationSlice = {
		isHeaderActionsExpanded: true,
		setHeaderActionsExpanded: () => undefined,
		toggleHeaderActions: () => undefined,
	};

	function set(
		partialOrFn:
			| Partial<NavigationSlice>
			| ((previous: NavigationSlice) => Partial<NavigationSlice>),
	): void {
		if (typeof partialOrFn === "function") {
			const patch = (partialOrFn as (previous: NavigationSlice) => Partial<NavigationSlice>)(state);
			state = { ...state, ...patch };
		} else {
			state = { ...state, ...partialOrFn };
		}
	}

	function get(): NavigationSlice {
		return state;
	}

	function stateRef(): NavigationSlice {
		return state;
	}

	const api = {
		getState: get,
		setState: set,
		subscribe:
			(_listener?: unknown): (() => void) =>
			() =>
				undefined,
		destroy: (): void => undefined,
		getInitialState(): NavigationSlice {
			return state;
		},
	};

	return { set, get, stateRef, api };
}

describe("createNavigationSlice", () => {
	it("should expose initial expanded state as true", () => {
		sliceResetFns.clear();
		const { set, get, api } = makeStore();
		const slice = createNavigationSlice(set, get, api);

		expect(slice.isHeaderActionsExpanded).toBe(true);
	});

	it("setHeaderActionsExpanded should update the store state", () => {
		sliceResetFns.clear();
		const { set, get, stateRef, api } = makeStore();
		const slice = createNavigationSlice(set, get, api);

		slice.setHeaderActionsExpanded(false);
		expect(stateRef().isHeaderActionsExpanded).toBe(false);
	});

	it("toggleHeaderActions should toggle the expanded state", () => {
		sliceResetFns.clear();
		const { set, get, stateRef, api } = makeStore();
		const slice = createNavigationSlice(set, get, api);

		slice.setHeaderActionsExpanded(true);
		expect(stateRef().isHeaderActionsExpanded).toBe(true);

		slice.toggleHeaderActions();
		expect(stateRef().isHeaderActionsExpanded).toBe(false);

		slice.toggleHeaderActions();
		expect(stateRef().isHeaderActionsExpanded).toBe(true);
	});

	it("registered reset function should restore default expanded state", () => {
		sliceResetFns.clear();
		const { set, get, stateRef, api } = makeStore();
		createNavigationSlice(set, get, api);

		// mutate away from default, then reset
		set({ isHeaderActionsExpanded: false });
		expect(stateRef().isHeaderActionsExpanded).toBe(false);

		resetAllSlices();
		expect(stateRef().isHeaderActionsExpanded).toBe(true);
	});
});
