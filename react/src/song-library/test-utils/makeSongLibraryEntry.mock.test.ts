import { describe, expect, it } from "vitest";

import makeSongLibraryEntry from "./makeSongLibraryEntry.mock";

describe("makeSongLibraryEntry", () => {
	it("returns defaults and accepts overrides", () => {
		const row = makeSongLibraryEntry();
		expect(row.song_id).toBe("song-123");
		expect(row.song_owner_id).toBe("owner-1");

		const overridden = makeSongLibraryEntry({ song_id: "s2", owner_username: "bob" });
		expect(overridden.song_id).toBe("s2");
		expect(overridden.owner_username).toBe("bob");
	});
});
