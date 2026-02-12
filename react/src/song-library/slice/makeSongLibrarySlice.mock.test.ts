import { describe, expect, it } from "vitest";

import makeSongLibraryEntry from "@/react/song-library/test-utils/makeSongLibraryEntry.mock";

import type { SongLibraryEntry } from "./song-library-types";

import makeSongLibrarySlice from "./makeSongLibrarySlice.mock";

describe("makeSongLibrarySlice", () => {
	it("reflects initial entries and setters update state", () => {
		const initial: Record<string, SongLibraryEntry> = {
			s1: makeSongLibraryEntry({
				song_id: "s1",
				song_owner_id: "o",
				user_id: "u",
				created_at: "t",
			}),
		};
		const get = makeSongLibrarySlice(initial);
		const slice = get();

		expect(slice.songLibraryEntries).toStrictEqual(initial);

		slice.setSongLibraryEntries({});
		expect(slice.songLibraryEntries).toStrictEqual({});

		slice.setSongLibraryError("err");
		expect(slice.songLibraryError).toBe("err");

		slice.setSongLibraryLoading(true);
		expect(slice.isSongLibraryLoading).toBe(true);
	});

	it("add and remove mutate state and isInSongLibrary reflects changes", () => {
		const get = makeSongLibrarySlice();
		const slice = get();

		const entry = makeSongLibraryEntry({
			song_id: "s2",
			song_owner_id: "o",
			user_id: "u",
			created_at: "t",
		});

		slice.addSongLibraryEntry(entry);
		expect(slice.isInSongLibrary("s2")).toBe(true);
		expect(slice.songLibraryEntries["s2"]).toStrictEqual(entry);

		slice.removeSongLibraryEntry("s2");
		expect(slice.isInSongLibrary("s2")).toBe(false);
	});

	it("exposes vi.fn spies for actions", () => {
		const get = makeSongLibrarySlice();
		const slice = get();

		slice.addSongLibraryEntry(
			makeSongLibraryEntry({ song_id: "s3", song_owner_id: "o", user_id: "u", created_at: "t" }),
		);
		expect(slice.addSongLibraryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ song_id: "s3" }),
		);
	});
});
