import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useDismissibleAlert from "./useDismissibleAlert";

describe("useDismissibleAlert", () => {
	it("plays exit animation then calls onDismiss and resets state", () => {
		const onDismiss = vi.fn();
		vi.useFakeTimers();
		const TICK_EPS = 10;

		const { result } = renderHook(() => useDismissibleAlert(onDismiss));

		expect(result.current.isClosing).toBe(false);

		// Trigger dismiss; ensure onDismiss is not called before animation
		result.current.handleDismiss();
		vi.advanceTimersByTime(result.current.ANIMATION_DURATION_MS - TICK_EPS);
		expect(onDismiss).not.toHaveBeenCalled();

		// Complete the animation and assert onDismiss is called and local state resets
		vi.advanceTimersByTime(TICK_EPS);

		const EXPECTED_CALLS = 1;
		expect(onDismiss).toHaveBeenCalledTimes(EXPECTED_CALLS);
		expect(result.current.isClosing).toBe(false);

		vi.useRealTimers();
	});

	it("cleans up timer on unmount", async () => {
		const onDismiss = vi.fn();
		vi.useFakeTimers();

		const { result, unmount } = renderHook(() => useDismissibleAlert(onDismiss));

		result.current.handleDismiss();
		unmount();

		vi.advanceTimersByTime(result.current.ANIMATION_DURATION_MS);
		// onDismiss should not be called because we unmounted and cleared timer
		await Promise.resolve();
		expect(onDismiss).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});
