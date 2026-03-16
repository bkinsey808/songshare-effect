import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractAddSongRequest from "./extractAddSongRequest";

const INVALID_NON_OBJECT = 42;
const INVALID_SONG_ID = 123;
const INVALID_OWNER_ID = 456;

describe("extractAddSongRequest", () => {
	it("returns valid request when payload has song_id and song_owner_id", () => {
		const input = { song_id: "song-abc", song_owner_id: "owner-xyz" };
		const result = extractAddSongRequest(input);
		expect(result).toStrictEqual(input);
	});

	it("throws when given a non-object", () => {
		expect(() => extractAddSongRequest(makeNull())).toThrow(TypeError);
		expect(() => extractAddSongRequest(makeNull())).toThrow("Request must be a valid object");
		expect(() => extractAddSongRequest(INVALID_NON_OBJECT as unknown)).toThrow(
			"Request must be a valid object",
		);
	});

	it("throws when song_id is missing", () => {
		expect(() => extractAddSongRequest({ song_owner_id: "owner-1" } as unknown)).toThrow(
			"Request must contain song_id and song_owner_id",
		);
	});

	it("throws when song_owner_id is missing", () => {
		expect(() => extractAddSongRequest({ song_id: "song-1" } as unknown)).toThrow(
			"Request must contain song_id and song_owner_id",
		);
	});

	it("throws when song_id is not a string", () => {
		expect(() =>
			extractAddSongRequest({ song_id: INVALID_SONG_ID, song_owner_id: "owner-1" } as unknown),
		).toThrow("song_id and song_owner_id must be strings");
	});

	it("throws when song_owner_id is not a string", () => {
		expect(() =>
			extractAddSongRequest({ song_id: "song-1", song_owner_id: INVALID_OWNER_ID } as unknown),
		).toThrow("song_id and song_owner_id must be strings");
	});

	it("accepts empty strings for song_id and song_owner_id", () => {
		const input = { song_id: "", song_owner_id: "" };
		const result = extractAddSongRequest(input);
		expect(result).toStrictEqual(input);
	});
});
