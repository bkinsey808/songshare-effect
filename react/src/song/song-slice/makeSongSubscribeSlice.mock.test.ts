import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import type { Song } from "../song-schema";

import makeSongSubscribeSlice from "./makeSongSubscribeSlice.mock";

describe("makeSongSubscribeSlice", () => {
	it("reflects initial entries and setters update state", () => {
		const initial: Record<string, Song> = {
			s1: { song_id: "s1", created_at: "t", updated_at: "t" },
		};
		const get = makeSongSubscribeSlice({ initialPrivate: initial });
		const slice = get();

		expect(slice.privateSongs).toStrictEqual(initial);

		slice.addOrUpdatePrivateSongs({ s2: { song_id: "s2", created_at: "t", updated_at: "t" } });
		expect(slice.privateSongs["s2"]).toBeDefined();
	});

	it("add and remove active ids and call unsubscribe", async () => {
		const get = makeSongSubscribeSlice();
		const slice = get();

		// seed unsubscribe and active ids by calling the slice helpers
		const privateUnsub = slice.subscribeToActivePrivateSongs();
		expect(typeof privateUnsub).toBe("function");

		// Add active ids via the Effect-returning helper and run it
		await Effect.runPromise(slice.addActivePrivateSongIds(["a", "b"]));

		slice.removeActivePrivateSongIds(["a"]);
		expect(slice.activePrivateSongIds).toStrictEqual(["b"]);
	});

	it("subscribe functions return unsubscribe functions", () => {
		const get = makeSongSubscribeSlice();
		const slice = get();

		const privateUnsub = slice.subscribeToActivePrivateSongs();
		expect(typeof privateUnsub).toBe("function");

		const publicUnsub = slice.subscribeToActivePublicSongs();
		expect(typeof publicUnsub).toBe("function");
	});
});
