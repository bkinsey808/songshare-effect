import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchItemTagsEffect from "./fetchItemTagsRequest";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockClient = forceCast<ReturnType<typeof getSupabaseClient>>({});

describe("fetchItemTagsEffect", () => {
	it("returns [] when client is undefined", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(undefined);

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
		expect(callSelect).not.toHaveBeenCalled();
	});

	it("returns tag slugs on success", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
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
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
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
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
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
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({ data: [], error: { message: "db error" } }),
		);

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
	});

	it("returns [] when callSelect throws", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
		vi.mocked(callSelect).mockRejectedValueOnce(new Error("network error"));

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
	});

	it("returns [] when getSupabaseAuthToken throws", async () => {
		vi.mocked(getSupabaseAuthToken).mockRejectedValueOnce(new Error("auth error"));

		const result = await Effect.runPromise(fetchItemTagsEffect("song", "song-1"));

		expect(result).toStrictEqual([]);
	});
});
