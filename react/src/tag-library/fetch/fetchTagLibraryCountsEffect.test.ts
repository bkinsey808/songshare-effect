import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ZERO } from "@/shared/constants/shared-constants";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import makeTagLibraryGet from "../makeTagLibraryGet.test-util";
import fetchTagLibraryCountsEffect from "./fetchTagLibraryCountsEffect";
import type { TagItemCounts } from "./TagItemCounts.type";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

/**
 * Mock wrapper for `callSelect` used throughout these tests.
 * Set return values or implementations on `mockedCallSelect` instead of
 * calling `vi.mocked(callSelect)` at runtime to avoid hoisting issues.
 */
const mockedCallSelect = vi.mocked(callSelect);
const TOKEN = "test-token";
const TABLE_ARG_INDEX = 1;
const FIRST_CALL = 0;
const FIRST_ARG = 0;
const fakeClient = forceCast<ReturnType<typeof getSupabaseClient>>({});
const selectOk = forceCast<Awaited<ReturnType<typeof callSelect>>>({ data: [], error: undefined });

// Use the shared test helper to create fake slice getters and spies.

describe("fetchTagLibraryCountsEffect", () => {
	it("calls setTagLibraryCounts with empty object when no slugs", async () => {
		vi.resetAllMocks();
			const { get, setTagLibraryCounts } = makeTagLibraryGet(["setTagLibraryCounts", "getTagLibrarySlugs"]);
			forceCast<ReturnType<typeof vi.fn>>(get().getTagLibrarySlugs).mockReturnValue([]);

		await Effect.runPromise(fetchTagLibraryCountsEffect(get));

		expect(setTagLibraryCounts).toHaveBeenCalledWith({});
		expect(getSupabaseAuthToken).not.toHaveBeenCalled();
	});

	it("calls getSupabaseClient with the token from getSupabaseAuthToken", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		mockedCallSelect.mockResolvedValue(selectOk);
		const { get } = makeTagLibraryGet();

		await Effect.runPromise(fetchTagLibraryCountsEffect(get));

		expect(getSupabaseClient).toHaveBeenCalledWith(TOKEN);
	});

	it("queries each item type table with the user's slugs", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		mockedCallSelect.mockResolvedValue(selectOk);
		const { get } = makeTagLibraryGet();

		await Effect.runPromise(fetchTagLibraryCountsEffect(get));

		const tables = mockedCallSelect.mock.calls.map((call) => call[TABLE_ARG_INDEX]);
		expect(tables).toContain("song_tag");
		expect(tables).toContain("playlist_tag");
		expect(tables).toContain("event_tag");
		expect(tables).toContain("community_tag");
		expect(tables).toContain("image_tag");
	});

	it("aggregates counts correctly from junction table results", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		// Use a lookup table to avoid conditionals: song_tag → rock x2 + jazz, playlist_tag → jazz, rest empty
		const tableData: Record<string, { tag_slug: string }[]> = {
			song_tag: [{ tag_slug: "rock" }, { tag_slug: "rock" }, { tag_slug: "jazz" }],
			playlist_tag: [{ tag_slug: "jazz" }],
			event_tag: [],
			community_tag: [],
			image_tag: [],
		};
		mockedCallSelect.mockImplementation(
			forceCast((_client: unknown, table: string) =>
				promiseResolved({ data: tableData[table], error: undefined }),
			),
		);

		const { get, setTagLibraryCounts } = makeTagLibraryGet(["setTagLibraryCounts"]);

		await Effect.runPromise(fetchTagLibraryCountsEffect(get));

		expect(setTagLibraryCounts).toHaveBeenCalledWith({
			rock: { song: 2, playlist: 0, event: 0, community: 0, image: 0 },
			jazz: { song: 1, playlist: 1, event: 0, community: 0, image: 0 },
		});
	});

	it("fails when getSupabaseAuthToken rejects", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("auth error"));
		const { get } = makeTagLibraryGet();

		await expect(Effect.runPromise(fetchTagLibraryCountsEffect(get))).rejects.toThrow(/auth error/);
	});

	it("fails with 'No Supabase client available' when getSupabaseClient returns undefined", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);
		const { get } = makeTagLibraryGet();

		await expect(Effect.runPromise(fetchTagLibraryCountsEffect(get))).rejects.toThrow(
			/No Supabase client available/,
		);
	});

	it("ignores tag slugs from junction tables that are not in the user's library", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		mockedCallSelect.mockResolvedValue(
			forceCast({ data: [{ tag_slug: "unknown" }], error: undefined }),
		);

		const { get, setTagLibraryCounts } = makeTagLibraryGet(["setTagLibraryCounts"]);

		await Effect.runPromise(fetchTagLibraryCountsEffect(get));

		const result = forceCast<Record<string, TagItemCounts>>(
			forceCast<ReturnType<typeof vi.fn>>(setTagLibraryCounts)?.mock.calls[FIRST_CALL]?.[FIRST_ARG],
		);
		expect(result["unknown"]).toBeUndefined();
		expect(result["rock"]).toBeDefined();
		expect(result["jazz"]).toBeDefined();
	});

	it("treats a callSelect error response as zero counts for all item types", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		mockedCallSelect.mockResolvedValue(
			forceCast({ data: undefined, error: new Error("db error") }),
		);

		const { get, setTagLibraryCounts } = makeTagLibraryGet(["setTagLibraryCounts"]);

		await Effect.runPromise(fetchTagLibraryCountsEffect(get));

		const result = forceCast<Record<string, TagItemCounts>>(
			forceCast<ReturnType<typeof vi.fn>>(setTagLibraryCounts)?.mock.calls[FIRST_CALL]?.[FIRST_ARG],
		);
		expect(result["rock"]?.song).toBe(ZERO);
		expect(result["jazz"]?.song).toBe(ZERO);
	});
});
