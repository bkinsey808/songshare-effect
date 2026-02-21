import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import delay from "@/shared/utils/delay";

import useThrottle from "./useThrottle";

// numeric helpers to satisfy no-magic-numbers rule
const DEBOUNCE = 100;
const SHORT = 50;
const LONG = 1000;
const ONE = 1;
const TWO = 2;
const THREE = 3;
const FOUR = 4;

describe("useThrottle", () => {
	// manage timers locally instead of using hooks to satisfy eslint-plugin-jest/no-hooks

	it("calls callback immediately on first invocation", () => {
		const cb = vi.fn();
		const { result } = renderHook(() => useThrottle<[string]>(cb, DEBOUNCE));

		const { throttled } = result.current;
		throttled("x");

		expect(cb).toHaveBeenCalledTimes(ONE);
		expect(cb).toHaveBeenCalledWith("x");
	});

	it("defers additional calls until throttle window expires", async () => {
		const cb = vi.fn();
		const { result } = renderHook(() => useThrottle<[string]>(cb, DEBOUNCE));

		const { throttled } = result.current;
		throttled("a");
		throttled("b");
		throttled("c");

		expect(cb).toHaveBeenCalledTimes(ONE);

		await delay(DEBOUNCE);
		await waitFor(() => {
			expect(cb).toHaveBeenCalledTimes(TWO);
		});
		expect(cb).toHaveBeenLastCalledWith("c");
	});

	it("handles multiple windows and trailing values correctly", async () => {
		const cb = vi.fn();
		const { result } = renderHook(() => useThrottle<[number]>(cb, SHORT));

		const { throttled } = result.current;
		throttled(ONE);
		throttled(TWO);
		await delay(SHORT);

		throttled(THREE);
		throttled(FOUR);
		await delay(SHORT);

		expect(cb.mock.calls).toStrictEqual([[ONE], [TWO], [THREE], [FOUR]]);
	});

	it("flush() immediately invokes pending value and clears timer", async () => {
		const cb = vi.fn();
		const { result } = renderHook(() => useThrottle<[string]>(cb, DEBOUNCE));

		const { throttled } = result.current;
		throttled("first");
		throttled("second");

		expect(cb).toHaveBeenCalledTimes(ONE);

		result.current.flush();

		expect(cb).toHaveBeenCalledTimes(TWO);
		expect(cb).toHaveBeenLastCalledWith("second");

		await delay(LONG);
		expect(cb).toHaveBeenCalledTimes(TWO);
	});

	it("flush() does nothing when no pending invocation", () => {
		const cb = vi.fn();
		const { result } = renderHook(() => useThrottle<[string]>(cb, DEBOUNCE));

		const { throttled } = result.current;
		throttled("foo");

		result.current.flush();

		expect(cb).toHaveBeenCalledTimes(ONE);
	});
});
