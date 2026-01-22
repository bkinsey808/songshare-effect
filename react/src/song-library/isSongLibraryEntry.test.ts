import { describe, expect, it } from "vitest";

import isSongLibraryEntry from "./isSongLibraryEntry";

const TEST_SONG_ID = "s1";
const TEST_OWNER_ID = "o1";

describe("isSongLibraryEntry", () => {
	it("returns true for valid entry", () => {
		const val = { song_id: TEST_SONG_ID, song_owner_id: TEST_OWNER_ID, extra: 123 };
		expect(isSongLibraryEntry(val)).toBe(true);
	});

	it("returns false for missing fields", () => {
		expect(isSongLibraryEntry({})).toBe(false);
		expect(isSongLibraryEntry({ song_id: "s1" })).toBe(false);
		expect(isSongLibraryEntry({ song_owner_id: "o1" })).toBe(false);
	});

	it("returns false for non-string fields", () => {
		expect(isSongLibraryEntry({ song_id: "s1", song_owner_id: 456 })).toBe(false);
	});
});
