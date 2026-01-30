import { describe, expect, it } from "vitest";

import makeValidPlaylistPublic from "../test-utils/makeValidPlaylistPublic";
import isPlaylistPublic from "./isPlaylistPublic";

describe("isPlaylistPublic", () => {
	it("returns true for a valid PlaylistPublic record", () => {
		expect(isPlaylistPublic(makeValidPlaylistPublic())).toBe(true);
	});

	it("returns true for minimal required fields (no timestamps)", () => {
		const minimal = {
			playlist_id: "00000000-0000-0000-0000-000000000003",
			user_id: "00000000-0000-0000-0000-000000000004",
			playlist_name: "My Playlist",
			playlist_slug: "my-playlist",
			song_order: [],
		};
		expect(isPlaylistPublic(minimal)).toBe(true);
	});

	it("accepts an empty song_order array", () => {
		expect(isPlaylistPublic({ ...makeValidPlaylistPublic(), song_order: [] })).toBe(true);
	});

	it("rejects song_order arrays with non-string elements (schema enforces string elements)", () => {
		// The generated schema requires `song_order` elements to be strings
		const NON_STRING_ELEMENT = Symbol("non-string");
		expect(
			isPlaylistPublic({ ...makeValidPlaylistPublic(), song_order: [NON_STRING_ELEMENT, {}] }),
		).toBe(false);
	});

	it.each([
		["undefined", undefined],
		["empty object", {} as unknown],
		["playlist_id number", { ...makeValidPlaylistPublic(), playlist_id: 123 } as unknown],
		[
			"playlist_id missing",
			((): Record<string, unknown> => {
				const obj = { ...makeValidPlaylistPublic() } as Record<string, unknown>;
				delete obj["playlist_id"];
				return obj;
			})() as unknown,
		],
		["user_id undefined", { ...makeValidPlaylistPublic(), user_id: undefined } as unknown],
		["user_id number", { ...makeValidPlaylistPublic(), user_id: 123 } as unknown],
		["playlist_name number", { ...makeValidPlaylistPublic(), playlist_name: 123 } as unknown],
		["playlist_slug number", { ...makeValidPlaylistPublic(), playlist_slug: 123 } as unknown],
		[
			"playlist_slug missing",
			((): Record<string, unknown> => {
				const obj = { ...makeValidPlaylistPublic() } as Record<string, unknown>;
				delete obj["playlist_slug"];
				return obj;
			})(),
		],
		["song_order string", { ...makeValidPlaylistPublic(), song_order: "not-array" } as unknown],
		["song_order object", { ...makeValidPlaylistPublic(), song_order: {} } as unknown],
	])("returns false for malformed record: %s", (_name, value) => {
		expect(isPlaylistPublic(value)).toBe(false);
	});

	it("allows unknown extra fields (Schema strips unknown properties)", () => {
		// The generated schema strips unknown properties and validates known fields,
		// so extra properties do not cause validation to fail.
		expect(isPlaylistPublic({ ...makeValidPlaylistPublic(), extra: true as unknown })).toBe(true);
	});

	it("rejects empty string for playlist_name (non-empty constraint)", () => {
		// PlaylistPublicSchema enforces NonEmptyString for `playlist_name`
		expect(isPlaylistPublic({ ...makeValidPlaylistPublic(), playlist_name: "" })).toBe(false);
	});
});
