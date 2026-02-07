import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserLibraryEntry } from "../slice/user-library-types";

import createRemoveUserEffect from "./createRemoveUserEffect";

describe("createRemoveUserEffect", () => {
	it("removes user only when there are no songs/playlists", async () => {
		const userId = "u1";
		const followedUserId = "f1";
		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = vi.fn(() => Effect.succeed(undefined));
		const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		await Effect.runPromise(
			createRemoveUserEffect({
				entry,
				songsOwnedByUser: [],
				playlistsOwnedByUser: [],
				removeFromUserLibrary,
				removeSongFromSongLibrary,
				removePlaylistFromLibrary,
			}),
		);

		expect(removeFromUserLibrary).toHaveBeenCalledWith({ followed_user_id: followedUserId });
		expect(removeSongFromSongLibrary).not.toHaveBeenCalled();
		expect(removePlaylistFromLibrary).not.toHaveBeenCalled();
	});

	it("removes songs and playlists when present", async () => {
		const userId = "u2";
		const followedUserId = "f2";
		const songId1 = "s1";
		const songId2 = "s2";
		const playlistId1 = "p1";

		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = vi.fn(() => Effect.succeed(undefined));
		const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		const songs = [songId1, songId2];
		const playlists = [playlistId1];

		await Effect.runPromise(
			createRemoveUserEffect({
				entry,
				songsOwnedByUser: songs,
				playlistsOwnedByUser: playlists,
				removeFromUserLibrary,
				removeSongFromSongLibrary,
				removePlaylistFromLibrary,
			}),
		);

		expect(removeFromUserLibrary).toHaveBeenCalledWith({ followed_user_id: followedUserId });
		expect(removeSongFromSongLibrary).toHaveBeenCalledTimes(songs.length);
		expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: songId1 });
		expect(removePlaylistFromLibrary).toHaveBeenCalledTimes(playlists.length);
		expect(removePlaylistFromLibrary).toHaveBeenCalledWith({ playlist_id: playlistId1 });
	});

	it("continues when a song removal fails and still resolves", async () => {
		const userId = "u3";
		const followedUserId = "f3";
		const songOk = "ok";
		const songBad = "bad";
		const playlistOk = "p-ok";

		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = vi.fn(() => Effect.succeed(undefined));
		const removeSongFromSongLibrary = vi
			.fn()
			.mockImplementationOnce(() => Effect.succeed(undefined))
			.mockImplementationOnce(() => Effect.fail(new Error("boom")));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		const songs = [songOk, songBad];
		const playlists = [playlistOk];

		await Effect.runPromise(
			createRemoveUserEffect({
				entry,
				songsOwnedByUser: songs,
				playlistsOwnedByUser: playlists,
				removeFromUserLibrary,
				removeSongFromSongLibrary,
				removePlaylistFromLibrary,
			}),
		);

		expect(removeFromUserLibrary).toHaveBeenCalledWith({ followed_user_id: followedUserId });
		expect(removeSongFromSongLibrary).toHaveBeenCalledTimes(songs.length);
		expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: songOk });
		expect(removePlaylistFromLibrary).toHaveBeenCalledTimes(playlists.length);
	});

	it("fails when removeFromUserLibrary fails", async () => {
		const userId = "u4";
		const followedUserId = "f4";
		const songId = "s1";
		const playlistId = "p1";

		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = vi.fn(() => Effect.fail(new Error("user remove failed")));
		const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		await expect(
			Effect.runPromise(
				createRemoveUserEffect({
					entry,
					songsOwnedByUser: [songId],
					playlistsOwnedByUser: [playlistId],
					removeFromUserLibrary,
					removeSongFromSongLibrary,
					removePlaylistFromLibrary,
				}),
			),
		).rejects.toThrow(/user remove failed/);

		expect(removeFromUserLibrary).toHaveBeenCalledWith({ followed_user_id: followedUserId });
		expect(removeSongFromSongLibrary).not.toHaveBeenCalled();
		expect(removePlaylistFromLibrary).not.toHaveBeenCalled();
	});
});
