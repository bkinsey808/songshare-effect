import { describe, expect, it } from "vitest";

import guardAsPlaylistLibraryEntry from "./guardAsPlaylistLibraryEntry";

const validEntry = {
	playlist_id: "p1",
	user_id: "u1",
	created_at: "2024-01-01T00:00:00Z",
};

describe("guardAsPlaylistLibraryEntry", () => {
	it("returns the value when valid", () => {
		const result = guardAsPlaylistLibraryEntry(validEntry, "test");
		expect(result).toStrictEqual(validEntry);
	});

	it("returns entry with optional fields when present", () => {
		const withOptional = {
			...validEntry,
			owner_username: "bob",
			playlist_name: "My Playlist",
			playlist_slug: "my-playlist",
			playlist_public: { playlist_name: "My Playlist", playlist_slug: "my-playlist" },
		};
		const result = guardAsPlaylistLibraryEntry(withOptional, "test");
		expect(result).toStrictEqual(withOptional);
	});

	it("throws for non-object", () => {
		expect(() => guardAsPlaylistLibraryEntry(undefined, "test")).toThrow(TypeError);
	});

	it("throws for missing required fields", () => {
		expect(() => guardAsPlaylistLibraryEntry({}, "test")).toThrow(
			"test: missing or invalid playlist_id",
		);
		expect(() =>
			guardAsPlaylistLibraryEntry({ playlist_id: "p1" }, "test"),
		).toThrow("test: missing or invalid user_id");
		expect(() => guardAsPlaylistLibraryEntry({ ...validEntry, created_at: 123 }, "test")).toThrow(
			"test: missing or invalid created_at",
		);
	});
});
