import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";
import handleUserLibrarySubscribeEvent from "./handleUserLibrarySubscribeEvent";

const FOLLOWED_USER_ID = "user-1";
const VALID_INSERT = {
	user_id: "owner-1",
	followed_user_id: FOLLOWED_USER_ID,
	created_at: "2024-01-01T00:00:00Z",
};
const ENRICHED_ENTRY = { ...VALID_INSERT, owner_username: "alice" };

vi.mock(
	"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
	(): { default: ReturnType<typeof vi.fn> } => ({
		default: vi.fn().mockResolvedValue({
			user_id: "owner-1",
			followed_user_id: "user-1",
			created_at: "2024-01-01T00:00:00Z",
			owner_username: "alice",
		}),
	}),
);

describe("handleUserLibrarySubscribeEvent", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	it("does nothing when payload is not a realtime payload", async () => {
		const addUserLibraryEntry = vi.fn();
		const removeUserLibraryEntry = vi.fn();

		/**
		 * Test getter returning a `UserLibrarySlice` with add/remove helpers.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				addUserLibraryEntry,
				removeUserLibraryEntry,
			});
		}

		await Effect.runPromise(
			handleUserLibrarySubscribeEvent({ invalid: "payload" }, fakeClient, get),
		);

		expect(addUserLibraryEntry).not.toHaveBeenCalled();
		expect(removeUserLibraryEntry).not.toHaveBeenCalled();
	});

	it("adds enriched entry on INSERT", async () => {
		const addUserLibraryEntry = vi.fn();

		/**
		 * Test getter returning a `UserLibrarySlice` with add/remove helpers.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				addUserLibraryEntry,
				removeUserLibraryEntry: vi.fn(),
			});
		}

		await Effect.runPromise(
			handleUserLibrarySubscribeEvent(
				{ eventType: "INSERT", new: VALID_INSERT, old: undefined },
				fakeClient,
				get,
			),
		);

		expect(addUserLibraryEntry).toHaveBeenCalledWith(ENRICHED_ENTRY);
	});

	it("removes entry on DELETE when followed_user_id in old", async () => {
		const removeUserLibraryEntry = vi.fn();

		/**
		 * Test getter returning a `UserLibrarySlice` with add/remove helpers.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				addUserLibraryEntry: vi.fn(),
				removeUserLibraryEntry,
			});
		}

		await Effect.runPromise(
			handleUserLibrarySubscribeEvent(
				{ eventType: "DELETE", new: undefined, old: { followed_user_id: FOLLOWED_USER_ID } },
				fakeClient,
				get,
			),
		);

		expect(removeUserLibraryEntry).toHaveBeenCalledWith(FOLLOWED_USER_ID);
	});

	it("skips INSERT when new entry is malformed", async () => {
		const addUserLibraryEntry = vi.fn();

		/**
		 * Test getter returning a `UserLibrarySlice` with add/remove helpers.
		 *
		 * @returns UserLibrarySlice for the test
		 */
		function get(): UserLibrarySlice {
			return forceCast({
				addUserLibraryEntry,
				removeUserLibraryEntry: vi.fn(),
			});
		}

		await Effect.runPromise(
			handleUserLibrarySubscribeEvent(
				{ eventType: "INSERT", new: { invalid: "shape" }, old: undefined },
				fakeClient,
				get,
			),
		);

		expect(addUserLibraryEntry).not.toHaveBeenCalled();
	});
});
