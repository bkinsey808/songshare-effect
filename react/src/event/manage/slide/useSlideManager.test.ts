import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCurrentUserId from "@/react/auth/useCurrentUserId";

import useActiveSongSelectionState from "../../form/useActiveSongSelectionState";
import useEventView from "../../view/useEventView";
import { makeFakeManage, makeFakeView, makeFakeSelection } from "../test-utils";
import useEventManageState from "../useEventManageState";
import useSlideManagerState from "./useSlideManager";

// mocks for dependent hooks
vi.mock("../useEventManageState");
vi.mock("../../view/useEventView");
vi.mock("../../form/useActiveSongSelectionState");
vi.mock("@/react/auth/useCurrentUserId");

describe("useSlideManagerState", () => {
	it("forwards update functions and computes lists", () => {
		const fakeManage = makeFakeManage();
		// explicitly type the mocked hooks so we don't fall back to `any`.
		const mockedUseEventManageState = vi.mocked(useEventManageState);
		mockedUseEventManageState.mockReturnValue(fakeManage);

		const fakeView = makeFakeView();
		const mockedUseEventView = vi.mocked(useEventView);
		mockedUseEventView.mockReturnValue(fakeView);

		const fakeSelection = makeFakeSelection();
		const mockedUseActiveSongSelectionState = vi.mocked(useActiveSongSelectionState);
		mockedUseActiveSongSelectionState.mockReturnValue(fakeSelection);

		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		// user not in participants -> canAccess should be false
		const { result } = renderHook(() => useSlideManagerState());
		expect(result.current.canAccess).toBe(false);
		expect(result.current.availablePlaylistSongs).toHaveLength(
			fakeSelection.availablePlaylistSongs.length,
		);
		expect(result.current.availableSongSlidePositions).toHaveLength(
			fakeSelection.availableSongSlidePositions.length,
		);

		// invoking update functions should call mocks
		result.current.updateActiveSong("x");
		expect(fakeManage.updateActiveSong).toHaveBeenCalledWith("x");
	});

	it("grants access when user is playlist admin", () => {
		const fakeManage = makeFakeManage({
			participants: [
				{
					user_id: "u1",
					role: "event_playlist_admin",
					status: "joined",
					event_id: "e1",
					joined_at: "2026-01-01T00:00:00Z",
				},
			],
		});
		const mockedUseEventManageState = vi.mocked(useEventManageState);
		mockedUseEventManageState.mockReturnValue(fakeManage);
		const fakeView2 = makeFakeView({
			activeSlidePosition: undefined,
			activeSongTotalSlides: 0,
		});
		const mockedUseEventView = vi.mocked(useEventView);
		mockedUseEventView.mockReturnValue(fakeView2);
		const fakeSelection2 = makeFakeSelection({
			availablePlaylistSongs: [],
			availableSongSlidePositions: [],
			hasSelectedPlaylist: false,
			hasPlaylistSongs: false,
			hasNoPlaylistSongs: true,
			hasSelectedSong: false,
			hasSongSlides: false,
			hasNoSongSlides: true,
		});
		const mockedUseActiveSongSelectionState = vi.mocked(useActiveSongSelectionState);
		mockedUseActiveSongSelectionState.mockReturnValue(fakeSelection2);
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useSlideManagerState());
		expect(result.current.canAccess).toBe(true);
	});
});
