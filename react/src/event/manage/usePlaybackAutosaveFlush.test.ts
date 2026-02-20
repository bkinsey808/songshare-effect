import { cleanup, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { apiEventSavePath } from "@/shared/paths";

import usePlaybackAutosaveFlush from "./usePlaybackAutosaveFlush";

describe("usePlaybackAutosaveFlush", () => {
	function setup(): () => void {
		vi.resetAllMocks();
		return () => {
			cleanup();
		};
	}

	it("registers pagehide and beforeunload listeners and removes them on unmount", () => {
		const cleanupFn = setup();
		const addSpy = vi.spyOn(globalThis, "addEventListener");
		const removeSpy = vi.spyOn(globalThis, "removeEventListener");

		const songAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: undefined,
		};
		const slideAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: undefined,
		};
		const latestEventIdRef: { current: string | undefined } = { current: undefined };
		const latestSongIdRef: { current: string | undefined } = { current: undefined };
		const latestSlidePositionRef: { current: number | undefined } = { current: undefined };

		const { unmount } = renderHook(() => {
			usePlaybackAutosaveFlush({
				songAutosaveTimeoutRef,
				slideAutosaveTimeoutRef,
				latestEventIdRef,
				latestSongIdRef,
				latestSlidePositionRef,
			});
		});

		expect(addSpy).toHaveBeenCalledWith("pagehide", expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

		unmount();

		expect(removeSpy).toHaveBeenCalledWith("pagehide", expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

		addSpy.mockRestore();
		removeSpy.mockRestore();
		cleanupFn();
	});

	it("does nothing when there are no pending saves", () => {
		const cleanupFn = setup();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const songAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: undefined,
		};
		const slideAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: undefined,
		};
		const latestEventIdRef: { current: string | undefined } = { current: "event-1" };
		const latestSongIdRef: { current: string | undefined } = { current: "s" };
		const latestSlidePositionRef: { current: number | undefined } = { current: 1 };

		renderHook(() => {
			usePlaybackAutosaveFlush({
				songAutosaveTimeoutRef,
				slideAutosaveTimeoutRef,
				latestEventIdRef,
				latestSongIdRef,
				latestSlidePositionRef,
			});
		});

		globalThis.dispatchEvent(new Event("pagehide"));

		expect(fetchMock).not.toHaveBeenCalled();
		cleanupFn();
	});

	it("clears timeout but does not POST when event id is missing/empty", () => {
		const cleanupFn = setup();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const clearSpy = vi.spyOn(globalThis, "clearTimeout");

		const songAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers, no-magic-numbers, @typescript-eslint/no-unsafe-type-assertion
			current: 42 as unknown as ReturnType<typeof setTimeout>,
		};
		const slideAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: undefined,
		};
		const latestEventIdRef: { current: string | undefined } = { current: "" };
		const latestSongIdRef: { current: string | undefined } = { current: "s" };
		const latestSlidePositionRef: { current: number | undefined } = { current: 1 };

		renderHook(() => {
			usePlaybackAutosaveFlush({
				songAutosaveTimeoutRef,
				slideAutosaveTimeoutRef,
				latestEventIdRef,
				latestSongIdRef,
				latestSlidePositionRef,
			});
		});

		globalThis.dispatchEvent(new Event("pagehide"));

		// eslint-disable-next-line no-magic-numbers
		expect(clearSpy).toHaveBeenCalledWith(42);
		expect(songAutosaveTimeoutRef.current).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();

		clearSpy.mockRestore();
		cleanupFn();
	});

	it("posts active song and slide when both saves are pending and event id present", () => {
		const cleanupFn = setup();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const clearSpy = vi.spyOn(globalThis, "clearTimeout");

		// eslint-disable-next-line no-magic-numbers, @typescript-eslint/no-unsafe-type-assertion
		const SONG_TIMEOUT = 1 as unknown as ReturnType<typeof setTimeout>;
		// eslint-disable-next-line no-magic-numbers, @typescript-eslint/no-unsafe-type-assertion
		const SLIDE_TIMEOUT = 2 as unknown as ReturnType<typeof setTimeout>;

		const songAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: SONG_TIMEOUT,
		};
		const slideAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: SLIDE_TIMEOUT,
		};
		const latestEventIdRef: { current: string | undefined } = { current: "evt-1" };
		const latestSongIdRef: { current: string | undefined } = { current: "song-1" };
		const latestSlidePositionRef: { current: number | undefined } = { current: 5 };

		renderHook(() => {
			usePlaybackAutosaveFlush({
				songAutosaveTimeoutRef,
				slideAutosaveTimeoutRef,
				latestEventIdRef,
				latestSongIdRef,
				latestSlidePositionRef,
			});
		});

		globalThis.dispatchEvent(new Event("pagehide"));

		expect(clearSpy).toHaveBeenCalledWith(SONG_TIMEOUT);
		expect(clearSpy).toHaveBeenCalledWith(SLIDE_TIMEOUT);
		expect(songAutosaveTimeoutRef.current).toBeUndefined();
		expect(slideAutosaveTimeoutRef.current).toBeUndefined();

		expect(fetchMock).toHaveBeenCalledWith(apiEventSavePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			keepalive: true,
			body: JSON.stringify({
				event_id: "evt-1",
				active_song_id: "song-1",
				active_slide_position: 5,
			}),
		});

		clearSpy.mockRestore();
		cleanupFn();
	});

	it("posts null values when latest song/slide are undefined but saves pending", () => {
		const cleanupFn = setup();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const songAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			// eslint-disable-next-line no-magic-numbers, @typescript-eslint/no-unsafe-type-assertion
			current: 1 as unknown as ReturnType<typeof setTimeout>,
		};
		const slideAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			// eslint-disable-next-line no-magic-numbers, @typescript-eslint/no-unsafe-type-assertion
			current: 2 as unknown as ReturnType<typeof setTimeout>,
		};
		const latestEventIdRef: { current: string | undefined } = { current: "evt-2" };
		const latestSongIdRef: { current: string | undefined } = { current: undefined };
		const latestSlidePositionRef: { current: number | undefined } = { current: undefined };

		renderHook(() => {
			usePlaybackAutosaveFlush({
				songAutosaveTimeoutRef,
				slideAutosaveTimeoutRef,
				latestEventIdRef,
				latestSongIdRef,
				latestSlidePositionRef,
			});
		});

		globalThis.dispatchEvent(new Event("pagehide"));

		// Serialize mock calls and assert substrings from the JSON body
		const callsJson = JSON.stringify(vi.mocked(fetchMock).mock.calls);
		expect(callsJson).toContain("evt-2");
		expect(callsJson).toContain("active_song_id");
		expect(callsJson).toContain("active_slide_position");

		cleanupFn();
	});

	it("flush is called on unmount (cleanup) and triggers POST", () => {
		const cleanupFn = setup();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const songAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			// eslint-disable-next-line no-magic-numbers, @typescript-eslint/no-unsafe-type-assertion
			current: 1 as unknown as ReturnType<typeof setTimeout>,
		};
		const slideAutosaveTimeoutRef: { current: ReturnType<typeof setTimeout> | undefined } = {
			current: undefined,
		};
		const latestEventIdRef: { current: string | undefined } = { current: "evt-unmount" };
		const latestSongIdRef: { current: string | undefined } = { current: "song-unmount" };
		const latestSlidePositionRef: { current: number | undefined } = { current: undefined };

		const { unmount } = renderHook(() => {
			usePlaybackAutosaveFlush({
				songAutosaveTimeoutRef,
				slideAutosaveTimeoutRef,
				latestEventIdRef,
				latestSongIdRef,
				latestSlidePositionRef,
			});
		});

		unmount();

		expect(fetchMock).toHaveBeenCalledWith();

		// Serialize mock calls and assert the POST body contains expected fields
		const callsJson = JSON.stringify(vi.mocked(fetchMock).mock.calls);
		expect(callsJson).toContain("evt-unmount");
		expect(callsJson).toContain("song-unmount");

		cleanupFn();
	});
});
