import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";

import performUserLibraryInsert, { type UserLibraryRow } from "./performUserLibraryInsert";

describe("performUserLibraryInsert", () => {
	const FAKE_USER = "user-1";
	const REQUEST = { followed_user_id: "followed-1" };

	it("succeeds when supabase returns a row", async () => {
		const inserted: UserLibraryRow = {
			user_id: FAKE_USER,
			followed_user_id: REQUEST.followed_user_id,
			created_at: "2020-01-01T00:00:00Z",
		};

		const client = makeSupabaseClient({
			userLibraryInsertRows: [inserted],
		});

		const result = await Effect.runPromise(performUserLibraryInsert(client, FAKE_USER, REQUEST));
		expect(result.data).toStrictEqual(inserted);
		expect(result.error).toBeNull();
	});

	it("returns DatabaseError when insert throws", async () => {
		const client = makeSupabaseClient({
			userLibraryInsertError: new Error("boom"),
		});

		await expect(
			Effect.runPromise(performUserLibraryInsert(client, FAKE_USER, REQUEST)),
		).rejects.toThrow(/boom/);
	});
});
