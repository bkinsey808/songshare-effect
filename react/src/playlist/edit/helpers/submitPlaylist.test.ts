import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { PlaylistError } from "@/react/playlist/playlist-errors";

import submitPlaylist from "./submitPlaylist";

const PLAYLIST_ID = "pl-1";
const PLAYLIST_NAME = "My Playlist";
const PLAYLIST_SLUG = "my-playlist";

describe("submitPlaylist", () => {
	it("returns playlist id and navigates on success", async () => {
		const mockSave = vi.fn(() => Effect.succeed(PLAYLIST_ID));
		const mockNavigate = vi.fn();

		const result = await submitPlaylist(
			{
				savePlaylist: mockSave,
				navigate: mockNavigate,
				lang: "en",
			},
			{
				playlistName: PLAYLIST_NAME,
				playlistSlug: PLAYLIST_SLUG,
			},
		);

		expect(result).toBe(PLAYLIST_ID);
		expect(mockSave).toHaveBeenCalledWith(
			expect.objectContaining({
				playlist_name: PLAYLIST_NAME,
				playlist_slug: PLAYLIST_SLUG,
				public_notes: "",
				private_notes: "",
				song_order: [],
			}),
		);
		expect(mockNavigate).toHaveBeenCalledWith("/en/dashboard/playlist-library");
	});

	it("returns undefined and does not navigate when save fails", async () => {
		const mockSave = vi.fn(() => Effect.fail(forceCast<PlaylistError>(new Error("Save failed"))));
		const mockNavigate = vi.fn();

		const result = await submitPlaylist(
			{
				savePlaylist: mockSave,
				navigate: mockNavigate,
				lang: "en",
			},
			{
				playlistName: PLAYLIST_NAME,
				playlistSlug: PLAYLIST_SLUG,
			},
		);

		expect(result).toBeUndefined();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("includes playlistId in request when provided", async () => {
		const mockSave = vi.fn(() => Effect.succeed(PLAYLIST_ID));
		const mockNavigate = vi.fn();
		const PLAYLIST_ID_PARAM = "pl-existing";

		await submitPlaylist(
			{ savePlaylist: mockSave, navigate: mockNavigate, lang: "en" },
			{
				playlistName: PLAYLIST_NAME,
				playlistSlug: PLAYLIST_SLUG,
				playlistId: PLAYLIST_ID_PARAM,
			},
		);

		expect(mockSave).toHaveBeenCalledWith(
			expect.objectContaining({ playlist_id: PLAYLIST_ID_PARAM }),
		);
	});
});
