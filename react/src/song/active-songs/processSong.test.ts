import { describe, expect, it, vi } from "vitest";

import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";

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
			slide_order: ["slide-1"],
			slides: {
				"slide-1": {
					slide_name: "Verse 1",
					field_data: { en: "x" },
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
			lyrics: "sa",
			script: "sa-Latn",
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
			lyrics: ["sa"],
			script: ["sa-Latn"],
			translations: ["en"],
		});
		expect(out["s2"]?.slides["s1"]?.field_data).toStrictEqual({
			lyrics: "a",
			script: "b",
			en: "c",
		});
		spyWarn.mockRestore();
	});

	it("normalizes nullable script values returned by Supabase", () => {
		const rawSong = {
			song_id: "s3",
			song_name: "Scriptless Song",
			song_slug: "scriptless-song",
			lyrics: "en",
			script: makeNull(),
			translations: [],
			slide_order: ["slide-1"],
			slides: {
				"slide-1": {
					slide_name: "Verse 1",
					field_data: { lyrics: "Hello", script: "", enTranslation: "" },
				},
			},
			key: makeNull(),
			scale: makeNull(),
			user_id: "u1",
			short_credit: makeNull(),
			long_credit: makeNull(),
			public_notes: makeNull(),
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};
		const out: Record<string, ReturnType<typeof makeSongPublic>> = {};
		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		processSong(rawSong, out);

		expect(out["s3"]).toMatchObject({
			song_id: "s3",
			song_slug: "scriptless-song",
			lyrics: ["en"],
		});
		expect(out["s3"]?.script).toStrictEqual([]);
		expect(out["s3"]?.slides["slide-1"]?.field_data).toStrictEqual({
			lyrics: "Hello",
		});
		spyWarn.mockRestore();
	});
});
