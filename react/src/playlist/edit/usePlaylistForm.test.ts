import { renderHook, waitFor } from "@testing-library/react";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockLocaleWithLang from "@/react/test-utils/mockLocaleWithLang";
import { getOrCreateAppStore } from "@/react/zustand/useAppStore";

import submitPlaylist from "./helpers/submitPlaylist";
import usePlaylistForm from "./usePlaylistForm";

vi.mock("react-router-dom");
vi.mock("@/react/language/locale/useLocale");
vi.mock("./helpers/submitPlaylist");

describe("usePlaylistEdit", () => {
	it("delegates submit to submitPlaylist when creating a playlist", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useParams).mockReturnValue({});

		const store = getOrCreateAppStore();
		const mockSave = vi.fn();
		store.setState((prev) => ({ ...prev, savePlaylist: mockSave }));

		const { result } = renderHook(() => usePlaylistForm());

		// Populate form state using public API
		result.current.setPlaylistName("My Playlist");
		result.current.setPlaylistSlug("my-playlist");
		result.current.setPublicNotes("pub");
		result.current.setPrivateNotes("priv");
		result.current.handleSongAdded("s1");

		// Allow state to flush and assert the setter applied
		await waitFor(() => {
			expect(result.current.playlistName).toBe("My Playlist");
		});

		await result.current.handleSubmit();

		expect(submitPlaylist).toHaveBeenCalledWith(
			expect.objectContaining({ savePlaylist: mockSave, navigate: mockNavigate, lang: "en" }),
			expect.objectContaining({
				playlistName: "My Playlist",
				playlistSlug: "my-playlist",
				publicNotes: "pub",
				privateNotes: "priv",
				songOrder: ["s1"],
			}),
		);

		// Playlist ID should be omitted when creating a new playlist
		expect(submitPlaylist).toHaveBeenCalledWith(
			expect.anything(),
			expect.not.objectContaining({ playlistId: undefined }),
		);
	});

	it("includes playlistId when editing", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useParams).mockReturnValue({ playlist_id: "pl-123" });

		const store = getOrCreateAppStore();
		const mockSave = vi.fn();
		store.setState((prev) => ({ ...prev, savePlaylist: mockSave }));

		const { result } = renderHook(() => usePlaylistForm());

		// Populate form state using public API
		result.current.setPlaylistName("My Playlist");
		result.current.setPlaylistSlug("my-playlist");
		result.current.setPublicNotes("pub");
		result.current.setPrivateNotes("priv");
		result.current.handleSongAdded("s1");

		// Allow state to flush and assert the setter applied
		await waitFor(() => {
			expect(result.current.playlistName).toBe("My Playlist");
		});

		await result.current.handleSubmit();

		expect(submitPlaylist).toHaveBeenCalledWith(
			expect.objectContaining({ savePlaylist: mockSave, navigate: mockNavigate, lang: "en" }),
			expect.objectContaining({
				playlistName: "My Playlist",
				playlistSlug: "my-playlist",
				publicNotes: "pub",
				privateNotes: "priv",
				songOrder: ["s1"],
				playlistId: "pl-123",
			}),
		);
	});
});
