import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import { createPlaylistSlice, type PlaylistSlice } from "./playlist-slice";

function isUpdater(
	value: unknown,
): value is (prev: Record<string, unknown>) => Record<string, unknown> {
	return typeof value === "function";
}

function makeSetGet(): {
	set: (partial: unknown) => void;
	get: () => PlaylistSlice;
} {
	const state: Record<string, unknown> = {};
	const set = vi.fn((partial: unknown) => {
		if (isUpdater(partial)) {
			Object.assign(state, partial(state));
		} else if (typeof partial === "object" && partial !== null) {
			Object.assign(state, partial);
		}
	});
	const get = vi.fn(() => forceCast<PlaylistSlice>(state));
	return { set, get };
}

describe("createPlaylistSlice", () => {
	it("isSongInPlaylist returns false when no currentPlaylist", () => {
		const { set, get } = makeSetGet();
		const slice = createPlaylistSlice(forceCast(set), get, forceCast({}));

		expect(slice.isSongInPlaylist("s1")).toBe(false);
	});

	it("isSongInPlaylist returns false when song_order is absent", () => {
		const { set, get } = makeSetGet();
		set({ currentPlaylist: forceCast({ public: {} }) });
		const slice = createPlaylistSlice(forceCast(set), get, forceCast({}));

		expect(slice.isSongInPlaylist("s1")).toBe(false);
	});

	it("isSongInPlaylist returns true when song_id is in song_order", () => {
		const { set, get } = makeSetGet();
		set({
			currentPlaylist: forceCast({
				public: { song_order: ["s1", "s2"] },
			}),
		});
		const slice = createPlaylistSlice(forceCast(set), get, forceCast({}));

		expect(slice.isSongInPlaylist("s1")).toBe(true);
		expect(slice.isSongInPlaylist("s2")).toBe(true);
	});

	it("isSongInPlaylist returns false when song_id is not in song_order", () => {
		const { set, get } = makeSetGet();
		set({
			currentPlaylist: forceCast({
				public: { song_order: ["s1", "s2"] },
			}),
		});
		const slice = createPlaylistSlice(forceCast(set), get, forceCast({}));

		expect(slice.isSongInPlaylist("s3")).toBe(false);
	});

	it("clearCurrentPlaylist clears currentPlaylist and playlistError", () => {
		const { set, get } = makeSetGet();
		set({
			currentPlaylist: forceCast({ playlist_id: "p1" }),
			playlistError: "error",
		});
		const slice = createPlaylistSlice(forceCast(set), get, forceCast({}));

		slice.clearCurrentPlaylist();

		expect(set).toHaveBeenCalledWith({
			currentPlaylist: undefined,
			playlistError: undefined,
		});
	});
});
