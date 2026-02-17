import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import { makeTestPlaylist } from "@/react/playlist/test-utils/makeTestPlaylist.mock";
import { makeTestSong } from "@/react/song/test-utils/makeTestSong.mock";

import useActiveSongSelectionState from "./useActiveSongSelectionState";

const NO_SONGS = 0;

describe("useActiveSongSelectionState", () => {
	it("returns empty state when no playlist and no song are selected", () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		store.setState((previousState) => ({
			...previousState,
			currentPlaylist: undefined,
			publicSongs: {},
		}));

		const { result } = renderHook(() =>
			useActiveSongSelectionState({
				activePlaylistId: undefined,
				activeSongId: undefined,
			}),
		);

		expect(result.current).toMatchObject({
			hasSelectedPlaylist: false,
			hasPlaylistSongs: false,
			hasNoPlaylistSongs: false,
			hasSelectedSong: false,
			hasSongSlides: false,
			hasNoSongSlides: false,
		});
		expect(result.current.availablePlaylistSongs).toHaveLength(NO_SONGS);
		expect(result.current.availableSongSlidePositions).toHaveLength(NO_SONGS);
	});

	it("derives song and slide options for selected playlist and selected song", () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		store.setState((previousState) => ({
			...previousState,
			currentPlaylist: makeTestPlaylist({
				playlist_id: "playlist-1",
				public: {
					playlist_id: "playlist-1",
					playlist_name: "Playlist",
					playlist_slug: "playlist",
					user_id: "user-1",
					song_order: ["song-1", "song-2"],
					created_at: "",
					updated_at: "",
					public_notes: "",
				},
			}),
			publicSongs: {
				"song-1": makeTestSong({
					song_id: "song-1",
					song_name: "Song One",
					slide_order: ["slide-1", "slide-2"],
				}),
				"song-2": makeTestSong({
					song_id: "song-2",
					song_name: "Song Two",
					slide_order: ["slide-3"],
				}),
			},
		}));

		const { result } = renderHook(() =>
			useActiveSongSelectionState({
				activePlaylistId: "playlist-1",
				activeSongId: "song-1",
			}),
		);

		expect(result.current).toMatchObject({
			hasSelectedPlaylist: true,
			hasPlaylistSongs: true,
			hasNoPlaylistSongs: false,
			hasSelectedSong: true,
			hasSongSlides: true,
			hasNoSongSlides: false,
		});
		expect(result.current.availablePlaylistSongs).toStrictEqual([
			{ songId: "song-1", songName: "Song One" },
			{ songId: "song-2", songName: "Song Two" },
		]);
		expect(result.current.availableSongSlidePositions).toStrictEqual([
			{ slideId: "slide-1", position: 1 },
			{ slideId: "slide-2", position: 2 },
		]);
	});

	it("falls back to song id when selected song name is empty", () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		store.setState((previousState) => ({
			...previousState,
			currentPlaylist: makeTestPlaylist({
				playlist_id: "playlist-1",
				public: {
					playlist_id: "playlist-1",
					playlist_name: "Playlist",
					playlist_slug: "playlist",
					user_id: "user-1",
					song_order: ["song-1"],
					created_at: "",
					updated_at: "",
					public_notes: "",
				},
			}),
			publicSongs: {
				"song-1": makeTestSong({
					song_id: "song-1",
					song_name: "",
					slide_order: [],
				}),
			},
		}));

		const { result } = renderHook(() =>
			useActiveSongSelectionState({
				activePlaylistId: "playlist-1",
				activeSongId: "song-1",
			}),
		);

		expect(result.current.availablePlaylistSongs).toStrictEqual([
			{ songId: "song-1", songName: "song-1" },
		]);
		expect(result.current).toMatchObject({
			hasSelectedSong: true,
			hasSongSlides: false,
			hasNoSongSlides: true,
		});
	});

	it("falls back to song id when selected song record is missing", () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		store.setState((previousState) => ({
			...previousState,
			currentPlaylist: makeTestPlaylist({
				playlist_id: "playlist-1",
				public: {
					playlist_id: "playlist-1",
					playlist_name: "Playlist",
					playlist_slug: "playlist",
					user_id: "user-1",
					song_order: ["song-missing"],
					created_at: "",
					updated_at: "",
					public_notes: "",
				},
			}),
			publicSongs: {},
		}));

		const { result } = renderHook(() =>
			useActiveSongSelectionState({
				activePlaylistId: "playlist-1",
				activeSongId: "song-missing",
			}),
		);

		expect(result.current.availablePlaylistSongs).toStrictEqual([
			{ songId: "song-missing", songName: "song-missing" },
		]);
		expect(result.current).toMatchObject({
			hasSelectedSong: true,
			hasSongSlides: false,
			hasNoSongSlides: true,
		});
	});

	it("handles no-song states when playlist id is null-like or mismatched", () => {
		vi.resetAllMocks();
		const nullPlaylistId = forceCast<string | null | undefined>(JSON.parse("null"));
		const store: typeof useAppStore = useAppStore;
		store.setState((previousState) => ({
			...previousState,
			currentPlaylist: makeTestPlaylist({
				playlist_id: "playlist-2",
				public: {
					playlist_id: "playlist-2",
					playlist_name: "Playlist",
					playlist_slug: "playlist",
					user_id: "user-1",
					song_order: ["song-1"],
					created_at: "",
					updated_at: "",
					public_notes: "",
				},
			}),
			publicSongs: {
				"song-1": makeTestSong({ song_id: "song-1", song_name: "Song One" }),
			},
		}));

		const { result } = renderHook(() =>
			useActiveSongSelectionState({
				activePlaylistId: nullPlaylistId,
				activeSongId: "song-1",
			}),
		);

		expect(result.current).toMatchObject({
			hasSelectedPlaylist: true,
			hasPlaylistSongs: false,
			hasNoPlaylistSongs: true,
		});
		expect(result.current.availablePlaylistSongs).toHaveLength(NO_SONGS);
	});
});
