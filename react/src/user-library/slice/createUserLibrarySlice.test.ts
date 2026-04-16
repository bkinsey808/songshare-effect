import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import forceCast from "@/react/lib/test-utils/forceCast";

import createUserLibrarySlice from "./createUserLibrarySlice";
import type { UserLibrarySlice } from "./UserLibrarySlice.type";

/**
 * Returns a minimal mock store with vi.fn() stubs for set/get and a minimal api.
 * Get returns empty user library state so methods like getUserLibraryIds work.
 *
 * @returns An object containing `set`, `get`, and `api` for tests
 */
function makeMockStore(): {
	set: Set<UserLibrarySlice>;
	get: Get<UserLibrarySlice>;
	api: Api<UserLibrarySlice>;
} {
	const set = vi.fn();
	const get = forceCast<Get<UserLibrarySlice>>(
		vi.fn(() => ({
			userLibraryEntries: {},
			isUserLibraryLoading: false,
			userLibraryError: undefined,
		})),
	);
	const api: Api<UserLibrarySlice> = {
		setState: set as Set<UserLibrarySlice>,
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};
	return { set: set as Set<UserLibrarySlice>, get, api };
}

describe("createUserLibrarySlice", () => {
	it("returns initial state", () => {
		const { set, get, api } = makeMockStore();

		const slice = createUserLibrarySlice(set, get, api);

		expect(slice.userLibraryEntries).toStrictEqual({});
		expect(slice.isUserLibraryLoading).toBe(false);
		expect(slice.userLibraryError).toBeUndefined();
	});

	it("getUserLibraryIds returns empty array when library is empty", () => {
		const { set, get, api } = makeMockStore();

		const slice = createUserLibrarySlice(set, get, api);
		const ids = slice.getUserLibraryIds();

		expect(ids).toStrictEqual([]);
	});
});
