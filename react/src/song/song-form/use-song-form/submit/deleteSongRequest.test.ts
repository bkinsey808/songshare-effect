import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { apiSongsDeletePath } from "@/shared/paths";

import deleteSongEffect from "./deleteSongRequest";

describe("deleteSongEffect", () => {
	const SONG_ID = "song-123";
	const REQUEST_BODY = JSON.stringify({ song_id: SONG_ID });

	it("resolves when response is ok", async () => {
		// Arrange
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

		// Act + Assert
		await expect(Effect.runPromise(deleteSongEffect(SONG_ID))).resolves.toBeUndefined();
		expect(fetch).toHaveBeenCalledWith(apiSongsDeletePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: REQUEST_BODY,
			credentials: "include",
		});
	});

	it("fails with error message when response is not ok", async () => {
		// Arrange
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

		// Act + Assert
		await expect(Effect.runPromise(deleteSongEffect(SONG_ID))).rejects.toThrow("Song not found");
	});

	it("fails with error message on fetch rejection", async () => {
		// Arrange
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

		// Act + Assert
		await expect(Effect.runPromise(deleteSongEffect(SONG_ID))).rejects.toThrow("Network error");
	});
});
