import { describe, expect, it } from "vitest";

import type { SongSubscribeSlice } from "./song-slice";

import makeSongTestSlice from "./makeSongTestSlice.mock";

describe("makeSongTestSlice", () => {
	it("returns slice, getState, and setState and reflects updates", () => {
		const { slice, getState, setState } = makeSongTestSlice();

		setState({ privateSongs: { s1: { song_id: "s1", created_at: "t", updated_at: "t" } } });
		expect(getState().privateSongs["s1"]).toBeDefined();

		setState((prev: SongSubscribeSlice) => ({
			privateSongs: {
				...prev.privateSongs,
				s2: { song_id: "s2", created_at: "t", updated_at: "t" },
			},
		}));
		expect(getState().privateSongs["s2"]).toBeDefined();

		expect(typeof slice.subscribeToActivePrivateSongs).toBe("function");
	});
});
