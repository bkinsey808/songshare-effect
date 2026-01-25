import { describe, expect, it, vi } from "vitest";

import decodeSongData from "./decodeSongData";

describe("decodeSongData", () => {
	it("decodes valid song entries and skips invalid ones", () => {
		/* eslint-disable unicorn/no-null */
		const good = {
			song_id: "s1",
			song_name: "Hi",
			song_slug: "hi",
			fields: ["lyrics"],
			slide_order: ["1"],
			slides: { "1": { slide_name: "Slide 1", field_data: { lyrics: "a" } } },
			key: null,
			scale: null,
			user_id: "u",
			short_credit: null,
			long_credit: null,
			public_notes: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		const bad = { song_id: "s2", song_name: "X" };
		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const out = decodeSongData([good, bad]);

		expect(out["s1"]).toBeDefined();
		expect(out["s2"]).toBeUndefined();
		// The function logs a debug of decoded songs as the second warn call
		expect(spyWarn).toHaveBeenCalledWith("[decodeSongData] Decoded songs:", expect.any(Object));
		spyWarn.mockRestore();
	});
});
