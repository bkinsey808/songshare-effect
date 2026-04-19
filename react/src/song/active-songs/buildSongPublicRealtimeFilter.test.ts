import { describe, expect, it } from "vitest";

import buildSongPublicRealtimeFilter from "./buildSongPublicRealtimeFilter";

describe("buildSongPublicRealtimeFilter", () => {
	it.each([
		{
			name: "builds an eq filter for a single active public song id",
			activePublicSongIds: ["song-1"],
			expected: "song_id=eq.song-1",
		},
		{
			name: "builds an in filter for multiple active public song ids",
			activePublicSongIds: ["song-1", "song-2"],
			expected: "song_id=in.(song-1,song-2)",
		},
	])("$name", ({ activePublicSongIds, expected }) => {
		// Act
		const result = buildSongPublicRealtimeFilter(activePublicSongIds);

		// Assert
		expect(result).toBe(expected);
	});
});
