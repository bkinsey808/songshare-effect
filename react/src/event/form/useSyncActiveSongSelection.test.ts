import type React from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import { makeTestPlaylist } from "@/react/playlist/test-utils/makeTestPlaylist.mock";
import { makeTestSong } from "@/react/song/test-utils/makeTestSong.mock";

import type { EventFormValues } from "../event-types";

import useSyncActiveSongSelection from "./useSyncActiveSongSelection";

const CALLED_ONCE = 1;

type SetFormValuesState = React.Dispatch<React.SetStateAction<EventFormValues>>;

function makeFormValues(overrides: Partial<EventFormValues> = {}): EventFormValues {
	return {
		event_id: undefined,
		event_name: "",
		event_slug: "",
		event_description: "",
		event_date: "",
		is_public: false,
		active_playlist_id: undefined,
		active_song_id: undefined,
		active_slide_id: undefined,
		public_notes: "",
		private_notes: "",
		...overrides,
	};
}

function applySetStateAction(
	setStateAction: React.SetStateAction<EventFormValues>,
	previousValue: EventFormValues,
): EventFormValues {
	if (typeof setStateAction === "function") {
		return setStateAction(previousValue);
	}

	return setStateAction;
}

describe("useSyncActiveSongSelection", () => {
	it("does not fetch playlist when no playlist is selected", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
			currentPlaylist: undefined,
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues: makeFormValues({ active_playlist_id: undefined }),
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(fetchPlaylistById).not.toHaveBeenCalled();
			expect(setFormValuesState).not.toHaveBeenCalled();
		});
	});

	it("fetches selected playlist by id", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
			currentPlaylist: undefined,
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues: makeFormValues({ active_playlist_id: "playlist-1" }),
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(fetchPlaylistById).toHaveBeenCalledTimes(CALLED_ONCE);
			expect(fetchPlaylistById).toHaveBeenCalledWith("playlist-1");
		});
	});

	it("defaults active_song_id to first song when no active song is selected", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();
		const formValues = makeFormValues({
			active_playlist_id: "playlist-1",
			active_song_id: undefined,
		});

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
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
			},
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues,
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith(expect.any(Function));
		});

		const updatedValues = setFormValuesState.mock.calls.reduce((currentValues, call) => {
			const [setStateAction] = forceCast<[React.SetStateAction<EventFormValues>]>(call);
			return applySetStateAction(setStateAction, currentValues);
		}, formValues);
		expect(updatedValues.active_song_id).toBe("song-1");
	});

	it("keeps current active song when it exists in selected playlist", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
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
				"song-2": makeTestSong({
					song_id: "song-2",
					song_name: "Song Two",
					slide_order: ["slide-1", "slide-2"],
				}),
			},
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues: makeFormValues({
					active_playlist_id: "playlist-1",
					active_song_id: "song-2",
					active_slide_id: "slide-2",
				}),
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(fetchPlaylistById).toHaveBeenCalledWith("playlist-1");
		});
		expect(setFormValuesState).not.toHaveBeenCalled();
	});

	it("resets active song to first track when selected song is not in playlist", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();
		const formValues = makeFormValues({
			active_playlist_id: "playlist-1",
			active_song_id: "song-9",
		});

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
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
					slide_order: ["slide-1"],
				}),
			},
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues,
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith(expect.any(Function));
		});

		const updatedValues = setFormValuesState.mock.calls.reduce((currentValues, call) => {
			const [setStateAction] = forceCast<[React.SetStateAction<EventFormValues>]>(call);
			return applySetStateAction(setStateAction, currentValues);
		}, formValues);
		expect(updatedValues.active_song_id).toBe("song-1");
	});

	it("defaults active slide to first slide when no active slide is selected", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();
		const formValues = makeFormValues({
			active_playlist_id: "playlist-1",
			active_song_id: "song-1",
			active_slide_id: undefined,
		});

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
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
					song_name: "Song One",
					slide_order: ["slide-1", "slide-2"],
				}),
			},
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues,
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith(expect.any(Function));
		});

		const updatedValues = setFormValuesState.mock.calls.reduce((currentValues, call) => {
			const [setStateAction] = forceCast<[React.SetStateAction<EventFormValues>]>(call);
			return applySetStateAction(setStateAction, currentValues);
		}, formValues);
		expect(updatedValues.active_slide_id).toBe("slide-1");
	});

	it("resets active slide to first slide when selected slide is not in song", async () => {
		vi.resetAllMocks();
		const store: typeof useAppStore = useAppStore;
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const setFormValuesState = vi.fn<SetFormValuesState>();
		const formValues = makeFormValues({
			active_playlist_id: "playlist-1",
			active_song_id: "song-1",
			active_slide_id: "slide-9",
		});

		store.setState((prev) => ({
			...prev,
			fetchPlaylistById,
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
					song_name: "Song One",
					slide_order: ["slide-1", "slide-2"],
				}),
			},
		}));

		renderHook(() => {
			useSyncActiveSongSelection({
				formValues,
				setFormValuesState,
			});
		});

		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith(expect.any(Function));
		});

		const updatedValues = setFormValuesState.mock.calls.reduce((currentValues, call) => {
			const [setStateAction] = forceCast<[React.SetStateAction<EventFormValues>]>(call);
			return applySetStateAction(setStateAction, currentValues);
		}, formValues);
		expect(updatedValues.active_slide_id).toBe("slide-1");
	});
});
