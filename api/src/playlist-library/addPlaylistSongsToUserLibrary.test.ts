import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

// reuse shared supabase client mock and patch for song tables
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import makeNull from "@/react/lib/test-utils/makeNull.test-util";

import addPlaylistSongsToUserLibrary from "./addPlaylistSongsToUserLibrary";
import extendWithSongMocks from "./addPlaylistSongsToUserLibrary.test-util";

const FAKE_USER = "user-1";
const FAKE_PL = "pl-1";

describe("addPlaylistSongsToUserLibrary", () => {
	it("quietly returns if playlist fetch fails", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const base = makeSupabaseClient({
			playlistPublicSelectSingleRow: { user_id: "u" },
			playlistPublicSelectSingleError: { message: "nope" },
		});
		const client = extendWithSongMocks({
			base,
			songsResult: { data: undefined, error: undefined },
			existingLibraryResult: { data: undefined, error: undefined },
			insertResult: { data: undefined, error: undefined },
		});

		await Effect.runPromise(addPlaylistSongsToUserLibrary(client, FAKE_USER, FAKE_PL));
		expect(undefined).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(
			"[addPlaylistSongsToUserLibrary] Could not fetch playlist:",
			"nope",
		);
		warnSpy.mockRestore();
	});

	it("early returns when playlist has empty song_order", async () => {
		const base = makeSupabaseClient({
			playlistPublicSelectSingleRow: { song_order: [], user_id: "u" },
			playlistPublicSelectSingleError: makeNull(),
		});
		const client = extendWithSongMocks({
			base,
			songsResult: { data: undefined, error: undefined },
			existingLibraryResult: { data: undefined, error: undefined },
			insertResult: { data: undefined, error: undefined },
		});
		await Effect.runPromise(addPlaylistSongsToUserLibrary(client, FAKE_USER, FAKE_PL));
		expect(undefined).toBeUndefined();
	});

	it("handles songs fetch error gracefully", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const base = makeSupabaseClient({
			playlistPublicSelectSingleRow: { song_order: ["s1"], user_id: "u" },
			playlistPublicSelectSingleError: makeNull(),
		});
		const client = extendWithSongMocks({
			base,
			songsResult: { data: undefined, error: { message: "bad songs" } },
			existingLibraryResult: { data: undefined, error: undefined },
			insertResult: { data: undefined, error: undefined },
			playlistResult: { data: { song_order: ["s1"], user_id: "u" }, error: makeNull() },
		});

		await Effect.runPromise(addPlaylistSongsToUserLibrary(client, FAKE_USER, FAKE_PL));
		expect(undefined).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(
			"[addPlaylistSongsToUserLibrary] Could not fetch songs:",
			"bad songs",
		);
		warnSpy.mockRestore();
	});

	it("does nothing when all songs already in library", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const base = makeSupabaseClient({
			playlistPublicSelectSingleRow: { song_order: ["s1"], user_id: "u" },
			playlistPublicSelectSingleError: makeNull(),
		});
		const client = extendWithSongMocks({
			base,
			songsResult: { data: [{ song_id: "s1", user_id: "u1" }], error: makeNull() },
			existingLibraryResult: { data: [{ song_id: "s1" }], error: undefined },
			insertResult: { data: undefined, error: undefined },
			playlistResult: { data: { song_order: ["s1"], user_id: "u" }, error: makeNull() },
		});

		await Effect.runPromise(addPlaylistSongsToUserLibrary(client, FAKE_USER, FAKE_PL));
		expect(undefined).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(
			"[addPlaylistSongsToUserLibrary] All songs already in library",
		);
		warnSpy.mockRestore();
	});

	it("inserts missing songs and logs count", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const base = makeSupabaseClient({
			playlistPublicSelectSingleRow: { song_order: ["s1"], user_id: "u" },
			playlistPublicSelectSingleError: makeNull(),
		});
		const client = extendWithSongMocks({
			base,
			songsResult: {
				data: [
					{ song_id: "s1", user_id: "u1" },
					{ song_id: "s2", user_id: "u2" },
				],
				error: makeNull(),
			},
			existingLibraryResult: { data: [{ song_id: "s1" }], error: undefined },
			insertResult: { data: [{}, {}], error: undefined },
			playlistResult: { data: { song_order: ["s1"], user_id: "u" }, error: makeNull() },
		});

		await Effect.runPromise(addPlaylistSongsToUserLibrary(client, FAKE_USER, FAKE_PL));
		expect(undefined).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(
			"[addPlaylistSongsToUserLibrary] Added 1 songs to user library",
		);
		warnSpy.mockRestore();
	});
});
