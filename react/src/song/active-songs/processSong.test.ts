import { describe, expect, it, vi } from "vitest";

import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";

import processSong from "./processSong";

const FIRST_INDEX = 0;
const NON_RECORD_NUMBER = 42;
const ONE_LENGTH = 1;

describe("processSong", () => {
	it("does nothing when song is not a record", () => {
		const out: Record<string, ReturnType<typeof makeSongPublic>> = {};
		processSong(undefined, out);
		processSong(NON_RECORD_NUMBER, out);
		processSong("string", out);
		expect(Object.keys(out)).toHaveLength(FIRST_INDEX);
	});

	it("does nothing when song_id is not a string", () => {
		const out: Record<string, ReturnType<typeof makeSongPublic>> = {};
		processSong({ song_id: 123 }, out);
		processSong({ song_id: undefined }, out);
		expect(Object.keys(out)).toHaveLength(FIRST_INDEX);
	});

	it("adds song to out when strict decode succeeds", () => {
		const validSong = makeSongPublic({
			song_id: "s1",
			song_name: "Test Song",
			song_slug: "test-song",
			fields: ["lyrics", "script", "enTranslation"],
			slide_order: ["slide-1"],
			slides: {
				"slide-1": {
					slide_name: "Verse 1",
					field_data: { lyrics: "x", script: "", enTranslation: "" },
				},
			},
		});
		const out: Record<string, ReturnType<typeof makeSongPublic>> = {};
		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		processSong(validSong, out);

		expect(Object.keys(out)).toHaveLength(ONE_LENGTH);
		expect(out["s1"]).toMatchObject({
			song_id: "s1",
			song_name: "Test Song",
			song_slug: "test-song",
		});
		spyWarn.mockRestore();
	});

	it("adds normalized song when strict decode fails but normalization succeeds", () => {
		const rawSong = {
			song_id: "s2",
			song_name: "Raw Song",
			song_slug: "raw-song",
			fields: ["lyrics", "script", "enTranslation"],
			slide_order: ["s1"],
			slides: {
				s1: {
					slide_name: "Slide 1",
					field_data: { lyrics: "a", script: "b", enTranslation: "c" },
				},
			},
			key: "",
			scale: "",
			user_id: "u1",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};
		const out: Record<string, ReturnType<typeof makeSongPublic>> = {};
		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		processSong(rawSong, out);

		expect(Object.keys(out)).toHaveLength(ONE_LENGTH);
		expect(out["s2"]).toMatchObject({
			song_id: "s2",
			song_name: "Raw Song",
			song_slug: "raw-song",
		});
		spyWarn.mockRestore();
	});
});
