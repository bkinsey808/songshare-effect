import { describe, expect, it } from "vitest";

import playlistSliceInitialState from "./playlistSliceInitialState";

describe("playlistSliceInitialState", () => {
	it("has expected shape", () => {
		expect(playlistSliceInitialState.currentPlaylist).toBeUndefined();
		expect(playlistSliceInitialState.isPlaylistLoading).toBe(false);
		expect(playlistSliceInitialState.playlistError).toBeUndefined();
		expect(playlistSliceInitialState.isPlaylistSaving).toBe(false);
	});

	it("has all required keys", () => {
		const expectedKeys = [
			"currentPlaylist",
			"isPlaylistLoading",
			"playlistError",
			"isPlaylistSaving",
		] as const;

		for (const key of expectedKeys) {
			expect(key in playlistSliceInitialState).toBe(true);
		}
	});
});
