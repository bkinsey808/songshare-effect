/* oxlint-disable */
// helper functions for tests; some lint rules are relaxed to keep callers clean
// (individual implementations still use local disables where necessary)

import { vi } from "vitest";

// The event-manage hooks rely on React Router for params/navigation.  In
// tests we stub the router once here rather than repeating the mock in every
// spec.  We keep the typing loose since the helpers live purely in tests.
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useParams: (): { event_slug: string } => ({ event_slug: "e1" }),
		useNavigate: vi.fn(),
	};
});

import useActiveSongSelectionState from "../form/useActiveSongSelectionState";
import useEventView from "../view/useEventView";
import useEventManageState from "./useEventManageState";

/**
 * Create a minimal fake return value for `useEventManageState`.
 *
 * @param overrides - partial properties to merge into the default fake
 */
export function makeFakeManage(
	overrides: Partial<ReturnType<typeof useEventManageState>> = {},
): ReturnType<typeof useEventManageState> {
	// using an `unknown` cast here keeps the implementation simple while still
	// allowing callers to treat the result as the correct typed shape.
	const base = {
		canManageEvent: false,
		participants: [],
		eventPublic: { active_playlist_id: "p1", active_song_id: "s1" },
		updateActiveSong: vi.fn(),
		updateActiveSlidePosition: vi.fn(),
	};
	return { ...base, ...overrides } as unknown as ReturnType<typeof useEventManageState>;
}

/**
 * Fake data for `useEventView`.
 *
 * @param overrides - partial payload to merge
 */
export function makeFakeView(
	overrides: Partial<ReturnType<typeof useEventView>> = {},
): ReturnType<typeof useEventView> {
	const base: ReturnType<typeof useEventView> = {
		activeSlidePosition: 2,
		activeSongTotalSlides: 5,
	} as ReturnType<typeof useEventView>;
	return { ...base, ...overrides };
}

/**
 * Fake data for `useActiveSongSelectionState`.
 *
 * @param overrides - partial payload to merge
 */
export function makeFakeSelection(
	overrides: Partial<ReturnType<typeof useActiveSongSelectionState>> = {},
): ReturnType<typeof useActiveSongSelectionState> {
	const base: ReturnType<typeof useActiveSongSelectionState> = {
		availablePlaylistSongs: [
			{ songId: "s1", songName: "Song 1" },
			{ songId: "s2", songName: "Song 2" },
		],
		availableSongSlidePositions: [
			{ slideId: "sl1", position: 1, slideName: "First" },
			{ slideId: "sl2", position: 2, slideName: "Second" },
		],
		hasSelectedPlaylist: true,
		hasPlaylistSongs: true,
		hasNoPlaylistSongs: false,
		hasSelectedSong: true,
		hasSongSlides: true,
		hasNoSongSlides: false,
	};
	return { ...base, ...overrides };
}
