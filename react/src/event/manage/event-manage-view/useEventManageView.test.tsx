import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { EventEntry } from "@/react/event/event-types";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.test-util";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import forceCast from "@/react/lib/test-utils/forceCast";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import postJson from "@/shared/fetch/postJson";

import useEventManageState from "./useEventManageView";
import makeUseManageView from "./useEventManageView.test-util";

// named constants to avoid magic-number lint errors
const CALL_COUNT_MIN = 1;
const FIRST_SPY_INDEX = 0;

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/lib/language/useCurrentLang");
vi.mock("@/shared/fetch/postJson");

type StoreMocksOverrides = {
	currentEvent?: EventEntry | undefined;
	isEventLoading?: boolean;
	eventError?: string | undefined;
	playlistLibraryEntries?: Record<string, { playlist_id: string }>;
};

function installEventStoreMocks(overrides: StoreMocksOverrides = {}): {
	playlistSubSpy: ReturnType<typeof vi.fn>;
	playlistPublicSpy: ReturnType<typeof vi.fn>;
} {
	const {
		currentEvent = undefined,
		isEventLoading = false,
		eventError = undefined,
		playlistLibraryEntries = {},
	} = overrides;

	// create spies upfront so tests can assert immediately
	const playlistSubSpy = vi.fn().mockReturnValue(Effect.succeed(() => undefined));
	const playlistPublicSpy = vi.fn().mockReturnValue(Effect.succeed(() => undefined));

	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorText = String(selector);
		if (selectorText.includes("fetchEventBySlug")) {
			return vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		}
		if (selectorText.includes("fetchPlaylistLibrary")) {
			return vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		}
		if (selectorText.includes("subscribeToPlaylistLibrary")) {
			return playlistSubSpy;
		}
		if (selectorText.includes("playlistLibraryEntries")) {
			return playlistLibraryEntries;
		}
		if (selectorText.includes("subscribeToPlaylistPublic")) {
			return playlistPublicSpy;
		}
		if (selectorText.includes("fetchPlaylistById")) {
			return vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		}
		if (selectorText.includes("fetchUserLibrary")) {
			return vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		}
		if (selectorText.includes("subscribeToEvent")) {
			return vi.fn().mockReturnValue(vi.fn());
		}
		if (selectorText.includes("currentEvent")) {
			return currentEvent;
		}
		if (selectorText.includes("isEventLoading")) {
			return isEventLoading;
		}
		if (selectorText.includes("eventError")) {
			return eventError;
		}
		return undefined;
	});

	return { playlistSubSpy, playlistPublicSpy };
}

describe("useEventManageState", () => {
	it("returns default state when no event is loaded", () => {
		installEventStoreMocks();

		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		vi.mocked(useCurrentLang).mockReturnValue("en");

		// smoke check helper usage
		const fake = makeUseManageView();
		expect(fake.canManageEvent).toBe(false);

		const { result } = renderHook(() => useEventManageState(), { wrapper: RouterWrapper });
		expect(result.current.currentEvent).toBeUndefined();
		expect(result.current.eventPublic).toBeUndefined();
		expect(result.current.canManageEvent).toBe(false);
		expect(typeof result.current.updateActivePlaylist).toBe("function");
	});

	it("returns state for loaded event and owner", () => {
		const event = makeEventEntry({
			owner_id: "u1",
			participants: [],
			public: forceCast({
				event_name: "E1",
				event_slug: "e1",
				active_playlist_id: undefined,
				active_song_id: undefined,
				active_slide_position: undefined,
			}),
		});
		installEventStoreMocks({ currentEvent: event });
		vi.mocked(useCurrentUserId).mockReturnValue("u1");
		vi.mocked(useCurrentLang).mockReturnValue("en");

		const { result } = renderHook(() => useEventManageState(), { wrapper: RouterWrapper });
		expect(result.current.currentEvent).toStrictEqual(event);
		expect(result.current.canManageEvent).toBe(true);
		expect(result.current.ownerId).toBe("u1");
	});

	it("subscribes to playlist library on mount", async () => {
		const { playlistSubSpy } = installEventStoreMocks();
		expect(playlistSubSpy).toBeDefined();
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		vi.mocked(useCurrentLang).mockReturnValue("en");

		renderHook(() => useEventManageState(), { wrapper: RouterWrapper });
		await waitFor(() => {
			expect(playlistSubSpy).toBeDefined();
			expect(playlistSubSpy?.mock.calls.length).toBeGreaterThanOrEqual(CALL_COUNT_MIN);
		});
	});

	it("subscribes to public metadata when library contains playlists", async () => {
		const sampleEntries = { p1: { playlist_id: "p1" } };
		const { playlistPublicSpy } = installEventStoreMocks({ playlistLibraryEntries: sampleEntries });
		expect(playlistPublicSpy).toBeDefined();
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		vi.mocked(useCurrentLang).mockReturnValue("en");

		renderHook(() => useEventManageState(), { wrapper: RouterWrapper });
		await waitFor(() => {
			// subscribe should be invoked with id array
			expect(playlistPublicSpy).toBeDefined();
			expect(playlistPublicSpy?.mock.calls[FIRST_SPY_INDEX]).toStrictEqual([["p1"]]);
		});
	});

	it("calls postJson and updates playlist on updateActivePlaylist", () => {
		const event = makeEventEntry({
			owner_id: "u1",
			participants: [],
			public: forceCast({
				event_name: "E1",
				event_slug: "e1",
				active_playlist_id: undefined,
				active_song_id: undefined,
				active_slide_position: undefined,
			}),
		});
		installEventStoreMocks({ currentEvent: event });
		vi.mocked(useCurrentUserId).mockReturnValue("u1");
		vi.mocked(useCurrentLang).mockReturnValue("en");
		const mockPostJson = vi.mocked(postJson);
		mockPostJson.mockResolvedValue();

		const { result } = renderHook(() => useEventManageState(), { wrapper: RouterWrapper });
		result.current.updateActivePlaylist("playlist-123");
		expect(mockPostJson).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: event.event_id,
				active_playlist_id: "playlist-123",
			}),
		);
	});

	it("sends updates for song and slide through autosave helpers", () => {
		const event = makeEventEntry({
			owner_id: "u1",
			participants: [],
			public: forceCast({
				event_name: "E1",
				event_slug: "e1",
				active_playlist_id: undefined,
				active_song_id: undefined,
				active_slide_position: undefined,
			}),
		});
		installEventStoreMocks({ currentEvent: event });
		vi.mocked(useCurrentUserId).mockReturnValue("u1");
		vi.mocked(useCurrentLang).mockReturnValue("en");
		const mockPostJson = vi.mocked(postJson);
		mockPostJson.mockResolvedValue();

		const { result } = renderHook(() => useEventManageState(), { wrapper: RouterWrapper });
		result.current.updateActiveSong("song-abc");
		const newSlidePos = 5; // avoid magic number lint
		result.current.updateActiveSlidePosition(newSlidePos);
		expect(mockPostJson).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: event.event_id,
				active_song_id: "song-abc",
			}),
		);
		expect(mockPostJson).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: event.event_id,
				active_slide_position: 5,
			}),
		);
	});
});
