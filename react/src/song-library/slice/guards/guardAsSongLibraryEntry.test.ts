import { describe, expect, it } from "vitest";

import guardAsSongLibraryEntry from "./guardAsSongLibraryEntry";

const TEST_SONG_ID = "s1";
const TEST_OWNER_ID = "o1";

describe("guardAsSongLibraryEntry", () => {
	it("returns the value when valid", () => {
		const val = { song_id: TEST_SONG_ID, song_owner_id: TEST_OWNER_ID };
		const result = guardAsSongLibraryEntry(val);
		expect(result).toStrictEqual(val);
	});

	it("throws for invalid entry", () => {
		expect(() => guardAsSongLibraryEntry({})).toThrow("Invalid SongLibraryEntry");
	});

	it("includes context in error message", () => {
		expect(() => guardAsSongLibraryEntry({}, "addToLibrary")).toThrow(
			"addToLibrary: invalid SongLibraryEntry",
		);
	});

	it("throws for missing fields", () => {
		expect(() => guardAsSongLibraryEntry({ song_id: "s1" })).toThrow("Invalid SongLibraryEntry");
		expect(() => guardAsSongLibraryEntry({ song_owner_id: "o1" })).toThrow(
			"Invalid SongLibraryEntry",
		);
	});

	it("throws for non-string fields", () => {
		expect(() => guardAsSongLibraryEntry({ song_id: "s1", song_owner_id: 456 })).toThrow(
			"Invalid SongLibraryEntry",
		);
	});
});
