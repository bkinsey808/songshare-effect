import { describe, it, expect } from "vitest";

import type { SongPublic } from "@/react/song/song-schema";

import { makeSongWithUndefinedName, makeTestSong } from "./makeTestSong.mock";

describe("makeTestSong helper", () => {
	it("provides sensible default identifiers and text", () => {
		const song = makeTestSong();

		expect(song.song_id).toBe("s1");
		expect(song.song_name).toBe("Test Song");
		expect(song.song_slug).toBe("test-song");
	});

	it("serializes nullable string fields as null", () => {
		const song = makeTestSong();
		expect(song.key).toBeNull();
		expect(song.scale).toBeNull();
		expect(song.short_credit).toBeNull();
		expect(song.long_credit).toBeNull();
		expect(song.public_notes).toBeNull();
	});

	it("starts with empty collections and timestamps", () => {
		const song = makeTestSong();
		expect(song.fields).toStrictEqual([]);
		expect(song.slide_order).toStrictEqual([]);
		expect(song.slides).toStrictEqual({});

		expect(song.created_at).toBe("2026-02-07T00:00:00Z");
		expect(song.updated_at).toBe("2026-02-07T00:00:00Z");
	});

	it("applies overrides correctly", () => {
		const overrides: Partial<SongPublic> = {
			song_id: "override-id",
			song_name: "Other",
		};

		const song = makeTestSong(overrides);
		expect(song.song_id).toBe("override-id");
		expect(song.song_name).toBe("Other");
	});
});

describe("makeSongWithUndefinedName helper", () => {
	it("always produces an undefined song_name even if base provides one", () => {
		const song = makeSongWithUndefinedName();
		expect(song.song_name).toBeUndefined();

		// other fields still come from default base
		expect(song.song_id).toBe("s1");
	});

	it("honors overrides except for name", () => {
		const song = makeSongWithUndefinedName({ song_id: "x", song_name: "won't use" });
		expect(song.song_id).toBe("x");
		expect(song.song_name).toBeUndefined();
	});
});
