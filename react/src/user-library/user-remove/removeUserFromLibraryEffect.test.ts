import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { apiUserLibraryRemovePath } from "@/shared/paths";

import type {
	AddUserToLibraryRequest,
	RemoveUserFromLibraryRequest,
} from "../slice/user-library-types";
import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import removeUserFromLibraryEffect from "./removeUserFromLibraryEffect";

function makeGet(
	setUserLibraryError = vi.fn(),
	removeUserLibraryEntry = vi.fn(),
): UserLibrarySlice {
	function addUserToLibrary(
		_request: Readonly<AddUserToLibraryRequest>,
	): Effect.Effect<void, Error> {
		return Effect.succeed(undefined);
	}

	function removeUserFromLibrary(
		_request: Readonly<RemoveUserFromLibraryRequest>,
	): Effect.Effect<void, Error> {
		return Effect.succeed(undefined);
	}

	function fetchUserLibrary(): Effect.Effect<void, Error> {
		return Effect.succeed(undefined);
	}

	function subscribeToUserLibrary(): Effect.Effect<() => void, Error> {
		return Effect.succeed(() => undefined);
	}

	function subscribeToUserPublicForLibrary(): Effect.Effect<() => void, Error> {
		return Effect.succeed(() => undefined);
	}

	return {
		userLibraryEntries: {},
		isUserLibraryLoading: false,
		userLibraryError: undefined,
		isInUserLibrary: () => false,
		addUserToLibrary,
		removeUserFromLibrary,
		getUserLibraryIds: () => [],
		fetchUserLibrary,
		subscribeToUserLibrary,
		subscribeToUserPublicForLibrary,
		userLibraryUnsubscribe: () => undefined,
		setUserLibraryEntries: vi.fn(),
		setUserLibraryLoading: vi.fn(),
		setUserLibraryError,
		addUserLibraryEntry: vi.fn(),
		removeUserLibraryEntry,
	};
}

describe("removeUserFromLibraryEffect", () => {
	it("succeeds and updates slice on 2xx response", async () => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();

		const followedUserId = "followed-1";
		const setUserLibraryError = vi.fn();
		const removeUserLibraryEntry = vi.fn();

		function get(): UserLibrarySlice {
			return makeGet(setUserLibraryError, removeUserLibraryEntry);
		}

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: "OK" } as unknown),
		);

		await Effect.runPromise(
			removeUserFromLibraryEffect(
				{ followed_user_id: followedUserId } as Readonly<RemoveUserFromLibraryRequest>,
				get,
			),
		);

		expect(setUserLibraryError).toHaveBeenCalledWith(undefined);
		expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(apiUserLibraryRemovePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ followed_user_id: followedUserId }),
		});
		expect(removeUserLibraryEntry).toHaveBeenCalledWith(followedUserId);

		vi.unstubAllGlobals();
	});

	it("fails when server returns non-2xx and does not update slice", async () => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();

		const followedUserId = "followed-2";
		const setUserLibraryError = vi.fn();
		const removeUserLibraryEntry = vi.fn();
		function get(): UserLibrarySlice {
			return makeGet(setUserLibraryError, removeUserLibraryEntry);
		}

		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue({ ok: false, status: 500, statusText: "Internal Error" } as unknown),
		);

		const promise = Effect.runPromise(
			removeUserFromLibraryEffect({ followed_user_id: followedUserId }, get),
		);
		await expect(promise).rejects.toThrow(/Server returned 500: Internal Error/);

		expect(setUserLibraryError).toHaveBeenCalledWith(undefined);
		expect(removeUserLibraryEntry).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});

	it("wraps network errors and surfaces message", async () => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();

		const followedUserId = "followed-3";
		const setUserLibraryError = vi.fn();
		const removeUserLibraryEntry = vi.fn();
		function get(): UserLibrarySlice {
			return makeGet(setUserLibraryError, removeUserLibraryEntry);
		}

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network")));

		const promise = Effect.runPromise(
			removeUserFromLibraryEffect({ followed_user_id: followedUserId }, get),
		);
		await expect(promise).rejects.toThrow(/no network/);

		expect(removeUserLibraryEntry).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});
});
