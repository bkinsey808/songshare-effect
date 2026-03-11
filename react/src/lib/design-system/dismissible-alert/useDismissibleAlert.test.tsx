import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useDismissibleAlert from "./useDismissibleAlert";

const ANIMATION_DURATION_MS = 200;
const EXPECTED_DISMISS_CALL_COUNT = 1;

describe("useDismissibleAlert", () => {
	it("returns initial non-closing state", () => {
		const onDismiss = vi.fn();
		const { result } = renderHook(() => useDismissibleAlert(onDismiss));

		expect(result.current.isClosing).toBe(false);
		expect(result.current.ANIMATION_DURATION_MS).toBe(ANIMATION_DURATION_MS);
		expect(typeof result.current.handleDismiss).toBe("function");
		expect(result.current.animClass).toBeTruthy();
	});

	it("sets isClosing when handleDismiss is called", () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		const { result } = renderHook(() => useDismissibleAlert(onDismiss));

		act(() => {
			result.current.handleDismiss();
		});

		expect(result.current.isClosing).toBe(true);
		expect(onDismiss).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(ANIMATION_DURATION_MS);
		});

		expect(onDismiss).toHaveBeenCalledTimes(EXPECTED_DISMISS_CALL_COUNT);
		expect(result.current.isClosing).toBe(false);
		vi.useRealTimers();
	});

	it("ignores handleDismiss when already closing", () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		const { result } = renderHook(() => useDismissibleAlert(onDismiss));

		act(() => {
			result.current.handleDismiss();
		});
		act(() => {
			result.current.handleDismiss();
		});

		expect(onDismiss).not.toHaveBeenCalled();
		act(() => {
			vi.advanceTimersByTime(ANIMATION_DURATION_MS);
		});
		expect(onDismiss).toHaveBeenCalledTimes(EXPECTED_DISMISS_CALL_COUNT);
		vi.useRealTimers();
	});

	it("cleans up timer on unmount", async () => {
		const onDismiss = vi.fn();
		vi.useFakeTimers();

		const { result, unmount } = renderHook(() => useDismissibleAlert(onDismiss));

		act(() => {
			result.current.handleDismiss();
		});
		unmount();

		act(() => {
			vi.advanceTimersByTime(ANIMATION_DURATION_MS);
		});
		// onDismiss should not be called because we unmounted and cleared timer
		await Promise.resolve();
		expect(onDismiss).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});
