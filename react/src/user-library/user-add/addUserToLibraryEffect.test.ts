import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";

import type {
	AddUserToLibraryRequest,
	RemoveUserFromLibraryRequest,
	UserLibraryEntry,
} from "../slice/user-library-types";
import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import addUserToLibraryEffect from "./addUserToLibraryEffect";

function makeGet(
	isInLibrary = false,
	setUserLibraryError = vi.fn(),
	addUserLibraryEntry = vi.fn(),
): UserLibrarySlice {
	return {
		userLibraryEntries: {},
		isUserLibraryLoading: false,
		userLibraryError: undefined,
		isInUserLibrary: () => isInLibrary,
		addUserToLibrary: (_req: Readonly<AddUserToLibraryRequest>) => Effect.succeed(undefined),
		removeUserFromLibrary: (_removeReq: Readonly<RemoveUserFromLibraryRequest>) =>
			Effect.succeed(undefined),
		getUserLibraryIds: () => [],
		fetchUserLibrary: () => Effect.succeed(undefined),
		subscribeToUserLibrary: () => Effect.succeed(() => undefined),
		subscribeToUserPublicForLibrary: () => Effect.succeed(() => undefined),
		userLibraryUnsubscribe: () => undefined,
		setUserLibraryEntries: vi.fn(),
		setUserLibraryLoading: vi.fn(),
		setUserLibraryError,
		addUserLibraryEntry,
		removeUserLibraryEntry: vi.fn(),
	};
}

describe("addUserToLibraryEffect", () => {
	it("adds user when server returns valid entry", async () => {
		const entry: UserLibraryEntry = {
			user_id: "u1",
			followed_user_id: "f1",
			created_at: "now",
			owner_username: "owner",
		};

		const setUserLibraryError = vi.fn();
		const addUserLibraryEntry = vi.fn();

		function get(): UserLibrarySlice {
			return makeGet(false, setUserLibraryError, addUserLibraryEntry);
		}

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse({ data: entry })));

		await Effect.runPromise(
			addUserToLibraryEffect({ followed_user_id: entry.followed_user_id }, get),
		);

		expect(setUserLibraryError).toHaveBeenCalledWith(undefined);
		expect(addUserLibraryEntry).toHaveBeenCalledWith(entry);

		vi.unstubAllGlobals();
	});

	it("no-ops when already in library (calls clientWarn)", async () => {
		const consoleWarnSpy = vi.spyOn(console, "warn");

		const setUserLibraryError = vi.fn();
		const addUserLibraryEntry = vi.fn();
		function get(): UserLibrarySlice {
			return makeGet(true, setUserLibraryError, addUserLibraryEntry);
		}

		await Effect.runPromise(addUserToLibraryEffect({ followed_user_id: "f2" }, get));

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"[addUserToLibrary] User already in library:",
			"f2",
		);
		expect(addUserLibraryEntry).not.toHaveBeenCalled();

		consoleWarnSpy.mockRestore();
	});

	it("fails when server returns non-2xx and sets error", async () => {
		const setUserLibraryError = vi.fn();
		const addUserLibraryEntry = vi.fn();
		function get(): UserLibrarySlice {
			return makeGet(false, setUserLibraryError, addUserLibraryEntry);
		}

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				mockFetchResponse(
					{},
					{
						ok: false,
						status: 500,
						statusText: "Internal Error",
					},
				),
			),
		);

		const promise = Effect.runPromise(addUserToLibraryEffect({ followed_user_id: "f3" }, get));
		await expect(promise).rejects.toThrow(/Server returned 500: Internal Error/);

		expect(addUserLibraryEntry).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it("wraps network errors and surfaces message", async () => {
		const setUserLibraryError = vi.fn();
		const addUserLibraryEntry = vi.fn();
		function get(): UserLibrarySlice {
			return makeGet(false, setUserLibraryError, addUserLibraryEntry);
		}

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network")));

		const promise = Effect.runPromise(addUserToLibraryEffect({ followed_user_id: "f4" }, get));
		await expect(promise).rejects.toThrow(/no network/);

		expect(addUserLibraryEntry).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});
