import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useActiveSongSelectionState from "@/react/event/form/useActiveSongSelectionState";
import useEventView from "@/react/event/view/useEventView";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventViewPath } from "@/shared/paths";

import useEventManageState from "../event-manage-view/useEventManageView";
import makeUseManageView from "../event-manage-view/useEventManageView.test-util";
import makeFakeSelection from "../test-utils/makeFakeSelection.test-util";
import makeFakeView from "../test-utils/makeFakeView.test-util";
import makeSelectChangeEvent from "../test-utils/makeSelectChangeEvent.test-util";
import mockReactRouter from "../test-utils/mockReactRouter.test-util";
import useSlideManagerView from "./useSlideManagerView";

// mock language and path builder modules
vi.mock("@/react/lib/language/useCurrentLang");
vi.mock("@/shared/language/buildPathWithLang");

// mocks for dependent hooks (paths must match imports)
vi.mock("../event-manage-view/useEventManageView");
vi.mock("@/react/event/view/useEventView");
vi.mock("@/react/event/form/useActiveSongSelectionState");
vi.mock("@/react/auth/useCurrentUserId");

// constants used across tests to avoid magic-number lint warnings
const FIRST_SLIDE = 1;
const CLAMPED_SLIDE = 2;
const SECOND_SONG_INDEX = 1;

function initBasicState(): {
	fakeManage: ReturnType<typeof useEventManageState>;
	fakeView: ReturnType<typeof useEventView>;
	fakeSelection: ReturnType<typeof useActiveSongSelectionState>;
} {
	// central reset so no beforeEach hook required
	vi.resetAllMocks();
	vi.mocked(useCurrentLang).mockReturnValue("en");
	mockReactRouter();

	const fakeManage = makeUseManageView({ canManageEvent: true });
	vi.mocked(useEventManageState).mockReturnValue(fakeManage);

	const fakeView = makeFakeView();
	vi.mocked(useEventView).mockReturnValue(fakeView);

	const fakeSelection = makeFakeSelection();
	vi.mocked(useActiveSongSelectionState).mockReturnValue(fakeSelection);

	vi.mocked(useCurrentUserId).mockReturnValue("u1");

	return { fakeManage, fakeView, fakeSelection };
}

// (no additional mocks needed; already configured above)

describe("useSlideManagerState", () => {
	it("computes initial values correctly", () => {
		const { fakeSelection } = initBasicState();

		const { result } = renderHook(() => useSlideManagerView(), { wrapper: RouterWrapper });

		expect(result.current.canAccess).toBe(true);
		expect(result.current.availablePlaylistSongs).toHaveLength(
			fakeSelection.availablePlaylistSongs.length,
		);
		expect(result.current.availableSongSlidePositions).toHaveLength(
			fakeSelection.availableSongSlidePositions.length,
		);
		expect(result.current.FIRST_SLIDE).toBe(FIRST_SLIDE);
		expect(result.current.maxSlide).toBe(fakeSelection.availableSongSlidePositions.length);
	});

	it("calls update helpers and clamps prev slide", () => {
		const { fakeManage, fakeView } = initBasicState();

		const { result } = renderHook(() => useSlideManagerView(), { wrapper: RouterWrapper });

		result.current.updateActiveSong("x");
		expect(fakeManage.updateActiveSong).toHaveBeenCalledWith("x");

		result.current.goToFirstSlide();
		expect(fakeManage.updateActiveSlidePosition).toHaveBeenCalledWith(FIRST_SLIDE);
		result.current.goToPrevSlide();
		expect(fakeManage.updateActiveSlidePosition).toHaveBeenCalledWith(FIRST_SLIDE);

		// bump the view's position so previous slide is clamped
		const CLAMP_TEST_POSITION = 5;
		vi.mocked(useEventView).mockReturnValue({
			...fakeView,
			activeSlidePosition: CLAMP_TEST_POSITION,
		});

		const { result: r2 } = renderHook(() => useSlideManagerView(), { wrapper: RouterWrapper });
		r2.current.goToPrevSlide();
		expect(fakeManage.updateActiveSlidePosition).toHaveBeenCalledWith(CLAMPED_SLIDE);

		// changing the slide dropdown should forward the numeric value
		const fakeEvent = makeSelectChangeEvent("5");
		r2.current.handleSlideSelectChange(fakeEvent);
		expect(fakeManage.updateActiveSlidePosition).toHaveBeenCalledWith(CLAMP_TEST_POSITION);
	});

	it("advances song index when selection changes", () => {
		const { fakeManage } = initBasicState();

		vi.mocked(useActiveSongSelectionState).mockReturnValue(
			makeFakeSelection({
				availablePlaylistSongs: [
					{ songId: "a", songName: "A" },
					{ songId: "b", songName: "B" },
					{ songId: "c", songName: "C" },
				],
				availableSongSlidePositions: [],
			}),
		);

		// adjust a copy of fakeManage so our hook sees the new ids; avoid
		// unsafe casts by typing the result explicitly.
		const modifiedManage: ReturnType<typeof useEventManageState> = {
			...fakeManage,
			// eventPublic is loosely typed in our fake generator, so TS can't
			// guarantee required fields. the override itself is safe.
			eventPublic: {
				...fakeManage.eventPublic,
				active_playlist_id: "p",
				active_song_id: "b",
				// add missing required props so TypeScript is happy
				event_id: "e",
				owner_id: "o",
				event_name: "name",
				event_slug: "slug",
				is_public: false,
			},
		};
		vi.mocked(useEventManageState).mockReturnValue(modifiedManage);

		const { result: r3 } = renderHook(() => useSlideManagerView(), { wrapper: RouterWrapper });

		expect(r3.current.currentSongIndex).toBe(SECOND_SONG_INDEX);
		r3.current.goToNextSong();
		expect(fakeManage.updateActiveSong).toHaveBeenCalledWith("c");
	});

	it("redirects back to event view when permission is lost", () => {
		// clear any previous builder calls so we only track this test
		vi.mocked(buildPathWithLang).mockClear();

		// navigation hook is already stubbed by test-utils; we don't need to
		// interact with it directly here, simply ensure the path builder runs.

		// configure state as if the user lost permission
		const fakeManage = makeUseManageView({
			canManageEvent: false,
			participants: [],
		});
		vi.mocked(useEventManageState).mockReturnValue(fakeManage);
		vi.mocked(useEventView).mockReturnValue(makeFakeView());
		vi.mocked(useActiveSongSelectionState).mockReturnValue(makeFakeSelection());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		// render the hook once (test-utils already provides event_slug "e1")
		renderHook(() => useSlideManagerView(), { wrapper: RouterWrapper });

		// verify builder got invoked with the param slug and the current lang
		expect(buildPathWithLang).toHaveBeenCalledWith(`/${eventViewPath}/e1`, "en");
		// navigate should receive whatever path builder returned
	});

	it("grants access when user is playlist admin", () => {
		const fakeManage = makeUseManageView({
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

		const { result } = renderHook(() => useSlideManagerView(), { wrapper: RouterWrapper });
		expect(result.current.canAccess).toBe(true);
	});
});
