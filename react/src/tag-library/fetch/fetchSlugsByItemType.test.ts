import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";

import { ITEM_TYPE_CONFIG } from "@/react/tag/item-type";

import { fetchSlugsByItemType } from "./fetchSlugsByItemType";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const fakeClient = forceCast<NonNullable<ReturnType<typeof getSupabaseClient>>>({});
const SLUGS = ["rock", "pop"];
const LIBRARY_IDS = ["song-1", "song-2"];

describe("itemTypeConfig", () => {
	it("maps each item type to the expected tag table name", () => {
		expect(
			Object.fromEntries(
				Object.entries(ITEM_TYPE_CONFIG).map(([key, val]) => [key, val.tagTable]),
			),
		).toStrictEqual({
			song: "song_tag",
			playlist: "playlist_tag",
			event: "event_tag",
			community: "community_tag",
			image: "image_tag",
		});
	});
});

describe("fetchSlugsByItemType", () => {
	it("calls callSelect with the correct table and options for 'song'", async () => {
		vi.mocked(callSelect).mockResolvedValue(forceCast({ data: [], error: undefined }));

		await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(callSelect).toHaveBeenCalledWith(fakeClient, "song_tag", {
			cols: "tag_slug, song_id",
			in: { col: "tag_slug", vals: SLUGS },
		});
	});

	it("calls callSelect with the correct table for 'playlist'", async () => {
		vi.mocked(callSelect).mockResolvedValue(forceCast({ data: [], error: undefined }));

		await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "playlist", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(callSelect).toHaveBeenCalledWith(fakeClient, "playlist_tag", expect.anything());
	});

	it("returns matching tag slugs whose item ID is in the library", async () => {
		vi.mocked(callSelect).mockResolvedValue(
			forceCast({
				data: [
					{ tag_slug: "rock", song_id: "song-1" }, // in library
					{ tag_slug: "pop", song_id: "song-2" }, // in library
					{ tag_slug: "jazz", song_id: "song-99" }, // NOT in library
				],
				error: undefined,
			}),
		);

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(result).toStrictEqual(["rock", "pop"]);
	});

	it("filters out rows missing a string tag_slug or item id", async () => {
		vi.mocked(callSelect).mockResolvedValue(
			forceCast({
				data: [
					{ tag_slug: "rock", song_id: "song-1" }, // valid, in library
					{ tag_slug: 42, song_id: "song-1" }, // tag_slug not a string
					{ tag_slug: "pop", song_id: "song-99" }, // song_id not in library
					{ other: "field" }, // missing both
					undefined,
					"not-an-object",
				],
				error: undefined,
			}),
		);

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(result).toStrictEqual(["rock"]);
	});

	it("returns empty array when result has an error", async () => {
		vi.mocked(callSelect).mockResolvedValue(
			forceCast({ data: [{ tag_slug: "rock", song_id: "song-1" }], error: new Error("db error") }),
		);

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when result is not a record", async () => {
		vi.mocked(callSelect).mockResolvedValue(forceCast(undefined));

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when data is null or absent", async () => {
		vi.mocked(callSelect).mockResolvedValue(forceCast({ data: undefined, error: undefined }));

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when callSelect rejects", async () => {
		vi.mocked(callSelect).mockRejectedValue(new Error("network error"));

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: LIBRARY_IDS }),
		);

		expect(result).toStrictEqual([]);
	});

	it("returns empty array and skips callSelect when libraryItemIds is empty", async () => {
		vi.mocked(callSelect).mockResolvedValue(forceCast({ data: [], error: undefined }));

		const result = await Effect.runPromise(
			fetchSlugsByItemType(fakeClient, "song", { slugs: SLUGS, libraryItemIds: [] }),
		);

		expect(result).toStrictEqual([]);
		expect(callSelect).not.toHaveBeenCalled();
	});
});
