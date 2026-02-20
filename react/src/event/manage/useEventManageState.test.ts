import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import forceCast from "@/react/lib/test-utils/forceCast";
import postJson from "@/shared/fetch/postJson";

import useEventManageState from "./useEventManageState";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/lib/language/useCurrentLang");
vi.mock("@/shared/fetch/postJson");
// Mock react-router-dom with the actual module and override hooks
// oxlint-disable-next-line jest/no-untyped-mock-factory
vi.mock("react-router-dom", async () => {
	// oxlint-disable-next-line @typescript-eslint/consistent-type-imports
	const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
	return {
		...actual,
		useParams: (): { event_slug: string } => ({ event_slug: "e1" }),
		useNavigate: vi.fn(),
	};
});

// Helper to stub `useAppStore` selectors used by these tests
function installEventStoreMocks(
	overrides: {
		currentEvent?: ReturnType<typeof makeEventEntry> | undefined;
		isEventLoading?: boolean;
		eventError?: unknown;
	} = {},
): void {
	const { currentEvent = undefined, isEventLoading = false, eventError = undefined } = overrides;
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorText = String(selector);
		if (selectorText.includes("fetchEventBySlug")) {
			return vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		}
		if (selectorText.includes("fetchPlaylistLibrary")) {
			return vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
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
}

describe("useEventManageState", () => {
	it("returns default state when no event is loaded", () => {
		installEventStoreMocks();
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		vi.mocked(useCurrentLang).mockReturnValue("en");

		const { result } = renderHook(() => useEventManageState());
		expect(result.current.currentEvent).toBeUndefined();
		expect(result.current.eventPublic).toBeUndefined();
		expect(result.current.canManageEvent).toBe(false);
		expect(result.current.activePlaylistDisplay).toBe("(none)");
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

		const { result } = renderHook(() => useEventManageState());
		expect(result.current.currentEvent).toStrictEqual(event);
		expect(result.current.canManageEvent).toBe(true);
		expect(result.current.ownerId).toBe("u1");
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

		const { result } = renderHook(() => useEventManageState());
		result.current.updateActivePlaylist("playlist-123");
		expect(mockPostJson).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: event.event_id,
				active_playlist_id: "playlist-123",
			}),
		);
	});
});
