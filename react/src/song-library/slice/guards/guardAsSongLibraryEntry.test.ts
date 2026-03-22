import { describe, expect, it } from "vitest";

import guardAsSongLibraryEntry from "./guardAsSongLibraryEntry";

const TEST_SONG_ID = "s1";
const TEST_USER_ID = "u1";

describe("guardAsSongLibraryEntry", () => {
	it("returns the value when valid", () => {
		const val = { song_id: TEST_SONG_ID, user_id: TEST_USER_ID };
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
		expect(() => guardAsSongLibraryEntry({ user_id: "u1" })).toThrow(
			"Invalid SongLibraryEntry",
		);
	});

	it("throws for non-string fields", () => {
		expect(() => guardAsSongLibraryEntry({ song_id: "s1", user_id: 456 })).toThrow(
			"Invalid SongLibraryEntry",
		);
	});
});
