import { describe, expect, it } from "vitest";
import extractAddPlaylistRequest from "./extractAddPlaylistRequest";

describe("extractAddPlaylistRequest", () => {
	it("returns a valid object when payload is correct", () => {
		const input = { playlist_id: "abc", playlist_owner_id: "owner" };
		const result = extractAddPlaylistRequest(input);
		expect(result).toStrictEqual(input);
	});

	it("throws when given a non-object", () => {
		expect(() => extractAddPlaylistRequest(undefined)).toThrow(TypeError);
		const notObject = 42;
		expect(() => extractAddPlaylistRequest(notObject as unknown)).toThrow(
			"Request must be a valid object",
		);
	});

	it("throws when playlist_id is missing", () => {
		expect(() =>
			extractAddPlaylistRequest({ playlist_owner_id: "owner" } as unknown),
		).toThrow("Request must contain playlist_id and playlist_owner_id");
	});

	it("throws when playlist_owner_id is missing", () => {
		expect(() =>
			extractAddPlaylistRequest({ playlist_id: "abc" } as unknown),
		).toThrow("Request must contain playlist_id and playlist_owner_id");
	});

	it("throws when playlist_id is not a string", () => {
		expect(() =>
			extractAddPlaylistRequest({ playlist_id: 123, playlist_owner_id: "owner" } as unknown),
		).toThrow("playlist_id and playlist_owner_id must be strings");
	});

	it("throws when playlist_owner_id is not a string", () => {
		expect(() =>
			extractAddPlaylistRequest({ playlist_id: "abc", playlist_owner_id: 456 } as unknown),
		).toThrow("playlist_id and playlist_owner_id must be strings");
	});
});
