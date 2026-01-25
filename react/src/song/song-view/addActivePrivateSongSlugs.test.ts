import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SongSubscribeSlice } from "./song-slice";

import addActivePrivateSongSlugs from "./addActivePrivateSongSlugs";

function makeGetWithActiveSlug(): SongSubscribeSlice {
	return {
		privateSongs: {},
		publicSongs: {
			s1: {
				song_id: "s1",
				song_slug: "slug-1",
				song_name: "Name",
				fields: ["lyrics", "script", "enTranslation"],
				slide_order: [],
				slides: {},
				key: "",
				scale: "",
				user_id: "",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				created_at: "2020-01-01T00:00:00.000Z",
				updated_at: "2020-01-01T00:00:00.000Z",
			},
		},
		activePrivateSongIds: ["s1"],
		activePublicSongIds: [],
		addOrUpdatePrivateSongs: () => undefined,
		addOrUpdatePublicSongs: () => undefined,
		addActivePrivateSongIds: (_songIds: readonly string[]): Effect.Effect<void, Error> =>
			Effect.sync(() => undefined),
		addActivePublicSongIds: (_songIds: readonly string[]): Effect.Effect<void, Error> =>
			Effect.sync(() => undefined),
		addActivePrivateSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		addActivePublicSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		removeActivePrivateSongIds: (_songIds: readonly string[]) => undefined,
		removeActivePublicSongIds: (_songIds: readonly string[]) => undefined,
		removeSongsFromCache: (_songIds: readonly string[]) => undefined,
		subscribeToActivePrivateSongs: () => undefined,
		subscribeToActivePublicSongs: () => undefined,
		getSongBySlug: () => undefined,
	};
}

function makeGetWithoutUserToken(): SongSubscribeSlice {
	return {
		privateSongs: {},
		publicSongs: {},
		activePrivateSongIds: [],
		activePublicSongIds: [],
		addOrUpdatePrivateSongs: () => undefined,
		addOrUpdatePublicSongs: () => undefined,
		addActivePrivateSongIds: (_songIds: readonly string[]): Effect.Effect<void, Error> =>
			Effect.sync(() => undefined),
		addActivePublicSongIds: (_songIds: readonly string[]): Effect.Effect<void, Error> =>
			Effect.sync(() => undefined),
		addActivePrivateSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		addActivePublicSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		removeActivePrivateSongIds: (_songIds: readonly string[]) => undefined,
		removeActivePublicSongIds: (_songIds: readonly string[]) => undefined,
		removeSongsFromCache: (_songIds: readonly string[]) => undefined,
		subscribeToActivePrivateSongs: () => undefined,
		subscribeToActivePublicSongs: () => undefined,
		getSongBySlug: () => undefined,
	};
}

describe("addActivePrivateSongSlugs", () => {
	it("returns early when all slugs are already active", async () => {
		const set = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await addActivePrivateSongSlugs(set, makeGetWithActiveSlug)(["slug-1"]);

		expect(warnSpy).toHaveBeenCalledWith(
			"[addActivePrivateSongSlugs] All song slugs already active, nothing to do.",
		);
		expect(set).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it("returns early when no user token present", async () => {
		const set = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await addActivePrivateSongSlugs(set, makeGetWithoutUserToken)(["missing-slug"]);

		expect(warnSpy).toHaveBeenCalledWith(
			"[addActivePrivateSongSlugs] No user token found. Cannot fetch songs.",
		);
		expect(set).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
