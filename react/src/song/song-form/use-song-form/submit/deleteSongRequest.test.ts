import { describe, expect, it, vi } from "vitest";

import { apiSongsDeletePath } from "@/shared/paths";

import deleteSongRequest from "./deleteSongRequest";

describe("deleteSongRequest", () => {
	const SONG_ID = "song-123";

	it("returns success when response is ok", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
		const result = await deleteSongRequest(SONG_ID);
		expect(result).toStrictEqual({ success: true });
		expect(fetch).toHaveBeenCalledWith(apiSongsDeletePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ song_id: SONG_ID }),
			credentials: "include",
		});
	});

	it("returns error message when response is not ok", async () => {
		const errorPayload = { error: "Song not found" };
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: async () => {
					await Promise.resolve();
					return errorPayload;
				},
				statusText: "Not Found",
			}),
		);
		const result = await deleteSongRequest(SONG_ID);
		expect(result).toStrictEqual({
			success: false,
			errorMessage: "Song not found",
		});
	});

	it("returns error message on fetch rejection", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
		const result = await deleteSongRequest(SONG_ID);
		expect(result).toStrictEqual({
			success: false,
			errorMessage: "Network error",
		});
	});
});
