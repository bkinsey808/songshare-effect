import { render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { PlaylistPublic } from "@/react/playlist/playlist-types";

import usePlaylistView from "./usePlaylistView";

vi.mock("react-router-dom");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/share/subscribe/useShareSubscription");
vi.mock("@/react/user-library/user-add/addUserToLibraryEffect");

type StoreOverrides = {
	currentPlaylist?: unknown;
	publicSongs?: Record<string, unknown>;
	isPlaylistLoading?: boolean;
	playlistError?: string | undefined;
	fetchPlaylist?: ReturnType<typeof vi.fn>;
	clearCurrentPlaylist?: ReturnType<typeof vi.fn>;
	addActivePublicSongIds?: ReturnType<typeof vi.fn>;
};

function installStoreMocks(overrides: StoreOverrides = {}): void {
	const fetchPlaylist =
		overrides.fetchPlaylist ?? vi.fn(() => Effect.succeed(undefined));
	const clearCurrentPlaylist = overrides.clearCurrentPlaylist ?? vi.fn();
	const addActivePublicSongIds =
		overrides.addActivePublicSongIds ?? vi.fn(() => Effect.succeed(undefined));

	const state = {
		currentPlaylist: overrides.currentPlaylist,
		publicSongs: overrides.publicSongs ?? {},
		isPlaylistLoading: overrides.isPlaylistLoading ?? false,
		playlistError: overrides.playlistError,
		fetchPlaylist,
		clearCurrentPlaylist,
		addActivePublicSongIds,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(input: typeof state) => unknown>(selector)(state),
	);
}

function getRequiredPlaylistPublic(value: PlaylistPublic | undefined): PlaylistPublic {
	if (value === undefined) {
		throw new Error("Expected playlist public data");
	}
	return value;
}

describe("usePlaylistView — Harness", () => {
	it("renders playlist name when available", () => {
		vi.mocked(useParams).mockReturnValue({ playlist_slug: "test-playlist" });
		vi.mocked(useCurrentUserId).mockReturnValue("owner-1");
		vi.mocked(useShareSubscription).mockImplementation(() => undefined);

		installStoreMocks({
			currentPlaylist: forceCast({
				playlist_id: "p1",
				user_id: "owner-1",
				public: { playlist_name: "Test Playlist", playlist_slug: "test-playlist", song_order: [] },
			}),
		});

		function Harness(): ReactElement {
			const playlistPublic = getRequiredPlaylistPublic(usePlaylistView().playlistPublic);
			const playlistName = playlistPublic.playlist_name;
			return <div data-testid="name">{playlistName}</div>;
		}

		const { getByTestId } = render(<Harness />);
		expect(getByTestId("name").textContent).toBe("Test Playlist");
	});
});

describe("usePlaylistView — renderHook", () => {
	it("fetches playlist by slug and auto-adds owner to user library", async () => {
		vi.mocked(useParams).mockReturnValue({ playlist_slug: "test-playlist" });
		vi.mocked(useCurrentUserId).mockReturnValue("not-owner");
		vi.mocked(useShareSubscription).mockImplementation(() => undefined);

		const mockFetch = vi.fn(() => Effect.succeed(undefined));
		installStoreMocks({
			fetchPlaylist: mockFetch,
			currentPlaylist: forceCast({
				playlist_id: "p1",
				user_id: "owner-123",
				public: { playlist_name: "Test", playlist_slug: "test-playlist", song_order: [] },
			}),
		});

		const mockAutoAdd = vi.mocked(addUserToLibraryEffect);
		mockAutoAdd.mockReturnValue(Effect.succeed(undefined));

		renderHook(() => usePlaylistView());

		expect(mockFetch).toHaveBeenCalledWith("test-playlist");

		await waitFor(() => {
			expect(mockAutoAdd).toHaveBeenCalledWith(
				{ followed_user_id: "owner-123" },
				expect.any(Function),
			);
		});
	});
});
