import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchUsername from "./fetchUsername";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

function makeMockClient(): SupabaseClientLike {
	return forceCast<SupabaseClientLike>({ from: vi.fn(), channel: vi.fn() });
}

describe("fetchUsername", () => {
	it("returns username when query returns valid user data", async () => {
		vi.mocked(callSelect).mockResolvedValue(asPostgrestResponse({ data: { username: "alice" } }));

		const result = await fetchUsername({
			client: makeMockClient(),
			userId: "user-1",
		});

		expect(result).toBe("alice");
		expect(callSelect).toHaveBeenCalledWith(
			expect.anything(),
			"user_public",
			expect.objectContaining({
				cols: "username",
				eq: { col: "user_id", val: "user-1" },
				single: true,
			}),
		);
	});

	it("returns undefined when query returns null data", async () => {
		// Postgrest API uses null for missing data
		vi.mocked(callSelect).mockResolvedValue(
			asPostgrestResponse({ data: JSON.parse("null") as unknown }),
		);

		const result = await fetchUsername({
			client: makeMockClient(),
			userId: "user-2",
		});

		expect(result).toBeUndefined();
	});

	it("returns undefined when query returns error", async () => {
		// Postgrest API uses null for data when error is set
		const responseWithError = {
			data: JSON.parse("null") as unknown,
			error: { message: "not found", code: "", details: "", hint: "", name: "postgres" },
		};
		vi.mocked(callSelect).mockResolvedValue(forceCast(responseWithError));

		const result = await fetchUsername({
			client: makeMockClient(),
			userId: "user-3",
		});

		expect(result).toBeUndefined();
	});

	it("uses custom column override when usernameColumn provided", async () => {
		vi.mocked(callSelect).mockResolvedValue(asPostgrestResponse({ data: { username: "bob" } }));

		const result = await fetchUsername({
			client: makeMockClient(),
			userId: "user-4",
			userIdColumn: "user_id",
			usernameColumn: "username",
		});

		expect(result).toBe("bob");
		expect(callSelect).toHaveBeenCalledWith(
			expect.anything(),
			"user_public",
			expect.objectContaining({
				cols: "username",
				eq: { col: "user_id", val: "user-4" },
				single: true,
			}),
		);
	});

	it("returns undefined when callSelect throws", async () => {
		vi.mocked(callSelect).mockRejectedValue(new Error("network error"));

		const result = await fetchUsername({
			client: makeMockClient(),
			userId: "user-5",
		});

		expect(result).toBeUndefined();
	});
});
