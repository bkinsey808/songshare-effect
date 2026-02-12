import { describe, expect, it, vi } from "vitest";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

import makeSongSubscribeSlice from "../song-slice/makeSongSubscribeSlice.mock";
import addActivePrivateSongSlugs from "./addActivePrivateSongSlugs";

function makeGetWithActiveSlug(): SongSubscribeSlice {
	const get = makeSongSubscribeSlice({
		initialPublic: {
			s1: {
				song_id: "s1",
				song_slug: "slug-1",
				song_name: "Name",
				fields: ["lyrics", "script", "enTranslation"],
				slide_order: [],
				slides: {},
				key: "",
				scale: "",
				user_id: "",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				created_at: "2020-01-01T00:00:00.000Z",
				updated_at: "2020-01-01T00:00:00.000Z",
			},
		},
		initialActivePrivateSongIds: ["s1"],
	});
	return get();
}

function makeGetWithoutUserToken(): SongSubscribeSlice {
	const get = makeSongSubscribeSlice();
	return get();
}

describe("addActivePrivateSongSlugs", () => {
	it("returns early when all slugs are already active", async () => {
		const set = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await addActivePrivateSongSlugs(set, makeGetWithActiveSlug)(["slug-1"]);

		expect(warnSpy).toHaveBeenCalledWith(
			"[addActivePrivateSongSlugs] All song slugs already active, nothing to do.",
		);
		expect(set).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it("returns early when no user token present", async () => {
		const set = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await addActivePrivateSongSlugs(set, makeGetWithoutUserToken)(["missing-slug"]);

		expect(warnSpy).toHaveBeenCalledWith(
			"[addActivePrivateSongSlugs] No user token found. Cannot fetch songs.",
		);
		expect(set).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
