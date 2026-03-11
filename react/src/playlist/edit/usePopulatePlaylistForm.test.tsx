import { render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { PlaylistEntry } from "../playlist-types";
import usePopulatePlaylistForm from "./usePopulatePlaylistForm";

const VALID_PLAYLIST: PlaylistEntry = forceCast({
	playlist_id: "p1",
	user_id: "u1",
	private_notes: "private",
	public: {
		playlist_id: "p1",
		playlist_name: "My Playlist",
		playlist_slug: "my-playlist",
		public_notes: "public notes",
		song_order: ["s1", "s2"],
	},
});

describe("usePopulatePlaylistForm — renderHook", () => {
	it("populates form when currentPlaylist has public and not fetching", async () => {
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const hasPopulatedRef = { current: false };
		const isFetchingRef = { current: false };

		const { rerender } = renderHook(
			({ currentPlaylist }) => {
				usePopulatePlaylistForm(currentPlaylist, {
					setFormValuesState,
					setIsLoadingData,
					hasPopulatedRef,
					isFetchingRef,
				});
			},
			{
				initialProps: { currentPlaylist: undefined as PlaylistEntry | undefined },
			},
		);

		expect(setFormValuesState).not.toHaveBeenCalled();

		rerender({ currentPlaylist: VALID_PLAYLIST });

		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith({
				playlist_id: "p1",
				playlist_name: "My Playlist",
				playlist_slug: "my-playlist",
				public_notes: "public notes",
				private_notes: "private",
				song_order: ["s1", "s2"],
			});
			expect(hasPopulatedRef.current).toBe(true);
			expect(setIsLoadingData).toHaveBeenCalledWith(false);
		});
	});

	it("does not populate when isFetchingRef is true", async () => {
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const hasPopulatedRef = { current: false };
		const isFetchingRef = { current: true };

		renderHook(() => {
			usePopulatePlaylistForm(VALID_PLAYLIST, {
				setFormValuesState,
				setIsLoadingData,
				hasPopulatedRef,
				isFetchingRef,
			});
		});

		await waitFor(() => {
			expect(setFormValuesState).not.toHaveBeenCalled();
		});
	});

	it("does not populate when hasPopulatedRef is already true", async () => {
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const hasPopulatedRef = { current: true };
		const isFetchingRef = { current: false };

		renderHook(() => {
			usePopulatePlaylistForm(VALID_PLAYLIST, {
				setFormValuesState,
				setIsLoadingData,
				hasPopulatedRef,
				isFetchingRef,
			});
		});

		await waitFor(() => {
			expect(setFormValuesState).not.toHaveBeenCalled();
		});
	});
});

describe("usePopulatePlaylistForm — Harness", () => {
	it("harness mounts hook with playlist and renders", async () => {
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const hasPopulatedRef = { current: false };
		const isFetchingRef = { current: false };

		function Harness(): ReactElement {
			usePopulatePlaylistForm(VALID_PLAYLIST, {
				setFormValuesState,
				setIsLoadingData,
				hasPopulatedRef,
				isFetchingRef,
			});
			return <div data-testid="harness-root" />;
		}

		const { getByTestId } = render(<Harness />);

		await waitFor(() => {
			expect(getByTestId("harness-root")).toBeTruthy();
			expect(setFormValuesState).toHaveBeenCalledWith({
				playlist_id: "p1",
				playlist_name: "My Playlist",
				playlist_slug: "my-playlist",
				public_notes: "public notes",
				private_notes: "private",
				song_order: ["s1", "s2"],
			});
		});
	});
});
