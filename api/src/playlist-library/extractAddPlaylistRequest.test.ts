import { describe, expect, it } from "vitest";

import extractAddPlaylistRequest from "./extractAddPlaylistRequest";

describe("extractAddPlaylistRequest", () => {
	it("returns a valid object when payload is correct", () => {
		const input = { playlist_id: "abc" };
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
		expect(() => extractAddPlaylistRequest({} as unknown)).toThrow(
			"Request must contain playlist_id",
		);
	});

	it("throws when playlist_id is not a string", () => {
		expect(() => extractAddPlaylistRequest({ playlist_id: 123 } as unknown)).toThrow(
			"playlist_id must be a string",
		);
	});
});
