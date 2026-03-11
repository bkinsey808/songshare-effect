import { cleanup, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

		const flushSong = vi.fn();
		const flushSlide = vi.fn();

		const { unmount } = renderHook(() => {
			usePlaybackAutosaveFlush({ flushSong, flushSlide });
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

	it("calls flush callbacks when pagehide event fires", () => {
		const cleanupFn = setup();
		const flushSong = vi.fn();
		const flushSlide = vi.fn();

		renderHook(() => {
			usePlaybackAutosaveFlush({ flushSong, flushSlide });
		});

		globalThis.dispatchEvent(new Event("pagehide"));

		expect(flushSong).toHaveBeenCalledWith();
		expect(flushSlide).toHaveBeenCalledWith();
		cleanupFn();
	});

	it("calls flush callbacks on unmount", () => {
		const cleanupFn = setup();
		const flushSong = vi.fn();
		const flushSlide = vi.fn();

		const { unmount } = renderHook(() => {
			usePlaybackAutosaveFlush({ flushSong, flushSlide });
		});

		unmount();

		expect(flushSong).toHaveBeenCalledWith();
		expect(flushSlide).toHaveBeenCalledWith();
		cleanupFn();
	});
});
