import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import fetchUsername from "@/react/lib/supabase/enrichment/fetchUsername";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import {
	makePlaylistWithUndefinedName,
	makePlaylistWithUndefinedSongOrder,
	makeTestPlaylist,
} from "@/react/playlist/test-utils/makeTestPlaylist.mock";
import { makeSongWithUndefinedName, makeTestSong } from "@/react/song/test-utils/makeTestSong.mock";

import useEventPlaylistAccordion, { usePlaylistSongDisplay } from "./useEventPlaylistAccordion";

vi.mock("@/react/lib/supabase/enrichment/fetchUsername");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");

describe("useEventPlaylistAccordion hooks", () => {
	describe("usePlaylistSongDisplay", () => {
		it("returns song data and subtext", async () => {
			const mockGetSupabaseClientSpy = await spyImport(
				"@/react/lib/supabase/client/getSupabaseClient",
			);
			mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());
			const publicSongs = {
				s1: makeTestSong({ song_name: "Song 1", user_id: "u1" }),
			};

			const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

			expect(result.current.song?.song_name).toBe("Song 1");
			expect(result.current.subText).toBe("...");
		});

		it("returns songId as name if song name is missing", async () => {
			const mockGetSupabaseClientSpy = await spyImport(
				"@/react/lib/supabase/client/getSupabaseClient",
			);
			mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());
			const publicSongs = {
				s1: makeSongWithUndefinedName({ user_id: "u1" }),
			};

			const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

			expect(result.current.song?.song_name).toBeUndefined();
		});

		it("fetches and displays username when available", async () => {
			const mockGetSupabaseClientSpy = await spyImport(
				"@/react/lib/supabase/client/getSupabaseClient",
			);
			mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());
			vi.mocked(fetchUsername).mockResolvedValue("user_one");

			const publicSongs = {
				s1: makeTestSong({ song_name: "Song 1", user_id: "u1" }),
			};

			const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

			await waitFor(() => {
				expect(result.current.ownerUsername).toBe("user_one");
				expect(result.current.subText).toBe("@user_one");
			});
		});

		it("returns empty subtext if no user_id", async () => {
			const mockGetSupabaseClientSpy = await spyImport(
				"@/react/lib/supabase/client/getSupabaseClient",
			);
			mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());
			const publicSongs = {
				s1: makeTestSong({ song_name: "Song 1", user_id: "" }),
			};

			const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

			expect(result.current.subText).toBe("");
		});
	});

	describe("useEventPlaylistAccordion", () => {
		it("returns loading true when currentPlaylist is undefined", () => {
			const store = useAppStore;
			store.setState((prev) => ({ ...prev, currentPlaylist: undefined }));

			const { result } = renderHook(() => useEventPlaylistAccordion("p1"));

			expect(result.current.isLoading).toBe(true);
		});

		it("returns loading true when playlistId mismatch", () => {
			const store = useAppStore;
			store.setState((prev) => ({
				...prev,
				currentPlaylist: makeTestPlaylist({ playlist_id: "other" }),
			}));

			const { result } = renderHook(() => useEventPlaylistAccordion("p1"));

			expect(result.current.isLoading).toBe(true);
		});

		it("returns loading true when song_order is missing or not an array", () => {
			const store = useAppStore;
			store.setState((prev) => ({
				...prev,
				currentPlaylist: makePlaylistWithUndefinedSongOrder(),
			}));

			const { result } = renderHook(() => useEventPlaylistAccordion("p1"));

			expect(result.current.isLoading).toBe(true);
		});

		it("returns playlist data when loaded", () => {
			const store = useAppStore;
			store.setState((prev) => ({
				...prev,
				currentPlaylist: makeTestPlaylist({
					playlist_id: "p1",
					public: {
						playlist_id: "p1",
						playlist_slug: "p1",
						user_id: "u1",
						created_at: "",
						updated_at: "",
						public_notes: "",
						playlist_name: "My Playlist",
						song_order: ["s1", "s2"],
					},
				}),
				publicSongs: { s1: makeTestSong({ song_name: "S1" }) },
			}));

			const { result } = renderHook(() => useEventPlaylistAccordion("p1"));

			expect(result.current.isLoading).toBe(false);
			expect(result.current.playlistName).toBe("My Playlist");
			expect(result.current.songOrder).toStrictEqual(["s1", "s2"]);
			expect(result.current.publicSongs).toHaveProperty("s1");
		});

		it("uses default playlist name if missing", () => {
			const store = useAppStore;
			store.setState((prev) => ({
				...prev,
				currentPlaylist: makePlaylistWithUndefinedName(),
			}));

			const { result } = renderHook(() => useEventPlaylistAccordion("p1"));

			expect(result.current.playlistName).toBe("Untitled Playlist");
		});
	});
});
