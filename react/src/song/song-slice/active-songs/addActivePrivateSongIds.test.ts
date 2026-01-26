import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SongSubscribeSlice } from "../song-slice";

import addActivePrivateSongIds from "./addActivePrivateSongIds";

describe("addActivePrivateSongIds", () => {
	it("early-returns when no active song ids are provided and warns", async () => {
		const set = vi.fn();
		function get(): SongSubscribeSlice {
			return {
				privateSongs: {},
				publicSongs: {},
				activePrivateSongIds: [] as readonly string[],
				activePublicSongIds: [] as readonly string[],
				addOrUpdatePrivateSongs: (_songs: Record<string, unknown>): void => {
					// no-op
				},
				addOrUpdatePublicSongs: (_songs: Record<string, unknown>): void => {
					// no-op
				},
				addActivePrivateSongIds: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
				addActivePublicSongIds: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
				addActivePrivateSongSlugs: async (): Promise<void> => {
					await Promise.resolve();
				},
				addActivePublicSongSlugs: async (): Promise<void> => {
					await Promise.resolve();
				},
				removeActivePrivateSongIds: (_songIds: readonly string[]): void => undefined,
				removeActivePublicSongIds: (_songIds: readonly string[]): void => undefined,
				subscribeToActivePrivateSongs: (): (() => void) | undefined => undefined,
				subscribeToActivePublicSongs: (): (() => void) | undefined => undefined,
				getSongBySlug: (_slug: string) => undefined,
				removeSongsFromCache: (_songIds: readonly string[]) => undefined,
			};
		}
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const effect = addActivePrivateSongIds(set, get)([]);

		// It should have updated the slice (called set twice: ids + unsubscribe)
		const EXPECTED_SET_CALLS = 2;
		const ARG_INDEX = 0;
		expect(set).toHaveBeenCalledTimes(EXPECTED_SET_CALLS);
		const hasFunctionArg = set.mock.calls.some(
			(call) => typeof (call as unknown[])[ARG_INDEX] === "function",
		);
		expect(hasFunctionArg).toBe(true);

		// Should warn synchronously
		expect(warnSpy).toHaveBeenCalledWith("[addActivePrivateSongIds] No active songs to fetch.");

		// And the returned effect should be the completed void effect
		await expect(Effect.runPromise(effect)).resolves.toBeUndefined();

		warnSpy.mockRestore();
	});
});
