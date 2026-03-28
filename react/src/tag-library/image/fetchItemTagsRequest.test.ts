import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchItemTagsEffect from "./fetchItemTagsRequest";

vi.mock("@/react/lib/supabase/client/getSupabaseClientWithAuth");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockClient = forceCast<Awaited<ReturnType<typeof getSupabaseClientWithAuth>>>({});

describe("fetchItemTagsEffect", () => {
	it("returns [] when client is undefined", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValueOnce(undefined);

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
		expect(callSelect).not.toHaveBeenCalled();
	});

	it("returns tag slugs on success", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValueOnce(mockClient);
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({
				data: [{ tag_slug: "rock" }, { tag_slug: "jazz" }],
				error: JSON.parse("null") as unknown,
			}),
		);

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual(["rock", "jazz"]);
	});

	it("calls callSelect with the correct table and id column per item type", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValueOnce(mockClient);
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({ data: [], error: JSON.parse("null") as unknown }),
		);

		await Effect.runPromise(fetchItemTagsEffect("playlist", "playlist-1"));

		expect(callSelect).toHaveBeenCalledWith(mockClient, "playlist_tag", {
			cols: "tag_slug",
			eq: { col: "playlist_id", val: "playlist-1" },
		});
	});

	it("skips rows missing tag_slug", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValueOnce(mockClient);
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({
				data: [{ tag_slug: "valid" }, { not_a_tag: true }, JSON.parse("null") as unknown],
				error: JSON.parse("null") as unknown,
			}),
		);

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual(["valid"]);
	});

	it("returns [] when callSelect returns an error", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValueOnce(mockClient);
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({ data: [], error: { message: "db error" } }),
		);

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
	});

	it("returns [] when callSelect throws", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValueOnce(mockClient);
		vi.mocked(callSelect).mockRejectedValueOnce(new Error("network error"));

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
	});

	it("returns [] when authenticated client creation throws", async () => {
		vi.mocked(getSupabaseClientWithAuth).mockRejectedValueOnce(new Error("auth error"));

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
	});
});
