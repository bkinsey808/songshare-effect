import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractAddSongRequest from "./extractAddSongRequest";

const INVALID_NON_OBJECT = 42;
const INVALID_SONG_ID = 123;

describe("extractAddSongRequest", () => {
	it("returns valid request when payload has song_id", () => {
		const input = { song_id: "song-abc" };
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
		expect(() => extractAddSongRequest({} as unknown)).toThrow("Request must contain song_id");
	});

	it("throws when song_id is not a string", () => {
		expect(() => extractAddSongRequest({ song_id: INVALID_SONG_ID } as unknown)).toThrow(
			"song_id must be a string",
		);
	});

	it("accepts empty string for song_id", () => {
		const input = { song_id: "" };
		const result = extractAddSongRequest(input);
		expect(result).toStrictEqual(input);
	});
});
