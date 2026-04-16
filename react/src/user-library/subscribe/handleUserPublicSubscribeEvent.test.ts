import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { UserLibraryEntry } from "../slice/user-library-types";
import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";
import handleUserPublicSubscribeEvent from "./handleUserPublicSubscribeEvent";

const USER_ID = "user-1";
const UPDATED_USERNAME = "alice-updated";
const ENTRY: UserLibraryEntry = {
	user_id: "owner-1",
	followed_user_id: USER_ID,
	created_at: "2024-01-01T00:00:00Z",
	owner_username: "alice",
};

describe("handleUserPublicSubscribeEvent", () => {
	it("does nothing when payload is not a realtime payload", async () => {
		const setUserLibraryEntries = vi.fn();
		/**
		 * Test getter returning a `UserLibrarySlice` with user entries and setter.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				userLibraryEntries: {},
				setUserLibraryEntries,
			});
		}

		await Effect.runPromise(handleUserPublicSubscribeEvent({ invalid: "payload" }, get));

		expect(setUserLibraryEntries).not.toHaveBeenCalled();
	});

	it("does nothing when eventType is not UPDATE", async () => {
		const setUserLibraryEntries = vi.fn();
		/**
		 * Test getter returning a `UserLibrarySlice` with user entries and setter.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				userLibraryEntries: {},
				setUserLibraryEntries,
			});
		}

		await Effect.runPromise(
			handleUserPublicSubscribeEvent({ eventType: "INSERT", new: {}, old: undefined }, get),
		);

		expect(setUserLibraryEntries).not.toHaveBeenCalled();
	});

	it("updates entry owner_username when user is in library", async () => {
		const setUserLibraryEntries = vi.fn();
		const entries = { [USER_ID]: ENTRY };
		/**
		 * Test getter returning a `UserLibrarySlice` with user entries and setter.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				userLibraryEntries: entries,
				setUserLibraryEntries,
			});
		}

		await Effect.runPromise(
			handleUserPublicSubscribeEvent(
				{
					eventType: "UPDATE",
					new: { user_id: USER_ID, username: UPDATED_USERNAME },
					old: {},
				},
				get,
			),
		);

		expect(setUserLibraryEntries).toHaveBeenCalledWith({
			[USER_ID]: { ...ENTRY, owner_username: UPDATED_USERNAME },
		});
	});

	it("does not update when user is not in library", async () => {
		const setUserLibraryEntries = vi.fn();
		/**
		 * Test getter returning a `UserLibrarySlice` with user entries and setter.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				userLibraryEntries: {},
				setUserLibraryEntries,
			});
		}

		await Effect.runPromise(
			handleUserPublicSubscribeEvent(
				{
					eventType: "UPDATE",
					new: { user_id: USER_ID, username: UPDATED_USERNAME },
					old: {},
				},
				get,
			),
		);

		expect(setUserLibraryEntries).not.toHaveBeenCalled();
	});

	it("does nothing when new record has no user_id or username", async () => {
		const setUserLibraryEntries = vi.fn();
		/**
		 * Test getter returning a `UserLibrarySlice` with user entries and setter.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				userLibraryEntries: { [USER_ID]: ENTRY },
				setUserLibraryEntries,
			});
		}

		await Effect.runPromise(
			handleUserPublicSubscribeEvent({ eventType: "UPDATE", new: {}, old: {} }, get),
		);

		expect(setUserLibraryEntries).not.toHaveBeenCalled();
	});
});
