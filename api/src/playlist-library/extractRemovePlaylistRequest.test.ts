
import { describe, expect, it } from "vitest";
import extractRemovePlaylistRequest from "./extractRemovePlaylistRequest";

describe("extractRemovePlaylistRequest", () => {
	it("returns a valid object when payload is correct", () => {
		const input = { playlist_id: "pl1" };
		const result = extractRemovePlaylistRequest(input);
		expect(result).toStrictEqual(input);
	});

	it("throws when given a non-object", () => {
		expect(() => extractRemovePlaylistRequest(undefined)).toThrow(TypeError);
		const notObject = 99;
		expect(() => extractRemovePlaylistRequest(notObject as unknown)).toThrow(
			"Request must be a valid object",
		);
	});

	it("throws when playlist_id is missing", () => {
		expect(() =>
			extractRemovePlaylistRequest({} as unknown),
		).toThrow("Request must contain playlist_id");
	});

	it("throws when playlist_id is not a string", () => {
		expect(() =>
			extractRemovePlaylistRequest({ playlist_id: 123 } as unknown),
		).toThrow("playlist_id must be a string");
	});
});
