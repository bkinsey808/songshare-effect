import { describe, expect, it } from "vitest";

import guardAsAddPlaylistRequest from "./guardAsAddPlaylistRequest";

const TEST_PLAYLIST_ID = "p1";
const BAD_PRIMITIVE = 123;

describe("guardAsAddPlaylistRequest", () => {
	it("returns the value when valid", () => {
		const val = { playlist_id: TEST_PLAYLIST_ID };
		const result = guardAsAddPlaylistRequest(val, "test");
		expect(result).toStrictEqual(val);
	});

	it("throws for non-object", () => {
		expect(() => guardAsAddPlaylistRequest(undefined, "test")).toThrow(TypeError);
		expect(() => guardAsAddPlaylistRequest(BAD_PRIMITIVE, "test")).toThrow(
			"test: expected object, got number",
		);
	});

	it("throws for missing playlist_id", () => {
		expect(() => guardAsAddPlaylistRequest({}, "test")).toThrow(
			"test: missing or invalid playlist_id",
		);
	});

	it("throws for non-string fields", () => {
		expect(() => guardAsAddPlaylistRequest({ playlist_id: 123 }, "test")).toThrow(
			"test: missing or invalid playlist_id",
		);
	});
});
