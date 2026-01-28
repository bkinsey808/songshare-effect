import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SCROLL_THRESHOLD } from "@/shared/constants/http";
import useIsScrolled from "./useIsScrolled";

describe("useIsScrolled", () => {
	function setup(): () => void {
		vi.resetAllMocks();
		return function teardown(): void {
			cleanup();
		};
	}

	it("defaults to false (not scrolled)", () => {
		const cleanup = setup();
		const { result, unmount } = renderHook(() => useIsScrolled());

		expect(result.current).toBe(false);

		unmount();
		cleanup();
	});

	it("becomes true when scrollY exceeds SCROLL_THRESHOLD", async () => {
		const cleanup = setup();
		const { result, unmount } = renderHook(() => useIsScrolled());

		// Ensure initial position is 0
		Object.defineProperty(globalThis, "scrollY", {
			value: 0,
			writable: true,
			configurable: true,
		});
		// dispatch a scroll to exercise handler at least once
		globalThis.dispatchEvent(new Event("scroll"));
		expect(result.current).toBe(false);

		// Move past the threshold and dispatch another scroll
		const DELTA = 1;
		Object.defineProperty(globalThis, "scrollY", {
			value: SCROLL_THRESHOLD + DELTA,
			writable: true,
			configurable: true,
		});
		globalThis.dispatchEvent(new Event("scroll"));

		await waitFor(() => {
			expect(result.current).toBe(true);
		});

		unmount();
		cleanup();
	});

	it("adds and removes scroll listener on mount/unmount", () => {
		const cleanup = setup();
		const addEventListener = vi.spyOn(globalThis, "addEventListener");
		const removeEventListener = vi.spyOn(globalThis, "removeEventListener");

		const { unmount } = renderHook(() => useIsScrolled());

		expect(addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));

		unmount();

		expect(removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));

		addEventListener.mockRestore();
		removeEventListener.mockRestore();
		cleanup();
	});
});
