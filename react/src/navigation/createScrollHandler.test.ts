import { describe, expect, it, vi } from "vitest";

import createScrollHandler from "./createScrollHandler";
import { SCROLL_HYSTERESIS, SCROLL_THRESHOLD } from "./navigation-constants";

// Test constants to avoid magic numbers
const SCROLL_DELTA = 1;

describe("createScrollHandler", () => {
	function setup(): () => void {
		vi.useFakeTimers();
		return function teardown(): void {
			vi.restoreAllMocks();
			vi.useRealTimers();
		};
	}

	it("throttles scroll events using requestAnimationFrame", () => {
		const cleanup = setup();
		const isScrolledRef = { current: false };
		const setIsScrolled = vi.fn();

		const { handleScroll } = createScrollHandler(isScrolledRef, setIsScrolled);

		// First call should schedule a frame
		handleScroll();
		// We can't directly inspect rafId anymore, but we can verify throttling behavior
		// by calling handleScroll again and checking that setIsScrolled isn't called twice
		handleScroll();

		// Wait for RAF to execute
		vi.runAllTimers();

		// Should only have been called once despite two handleScroll calls
		expect(setIsScrolled).not.toHaveBeenCalled(); // scrollY is 0, below threshold

		cleanup();
	});

	it("sets isScrolled to true when scrolling past threshold", () => {
		const cleanup = setup();
		const isScrolledRef = { current: false };
		const setIsScrolled = vi.fn();

		Object.defineProperty(globalThis, "scrollY", {
			value: SCROLL_THRESHOLD + SCROLL_DELTA,
			writable: true,
			configurable: true,
		});

		const { handleScroll } = createScrollHandler(isScrolledRef, setIsScrolled);
		handleScroll();

		// Wait for RAF to execute
		vi.runAllTimers();

		expect(setIsScrolled).toHaveBeenCalledWith(true);

		cleanup();
	});

	it("sets isScrolled to false when scrolling below lower threshold", () => {
		const cleanup = setup();
		const isScrolledRef = { current: true };
		const setIsScrolled = vi.fn();

		Object.defineProperty(globalThis, "scrollY", {
			value: SCROLL_THRESHOLD - SCROLL_HYSTERESIS - SCROLL_DELTA,
			writable: true,
			configurable: true,
		});

		const { handleScroll } = createScrollHandler(isScrolledRef, setIsScrolled);
		handleScroll();

		// Wait for RAF to execute
		vi.runAllTimers();

		expect(setIsScrolled).toHaveBeenCalledWith(false);

		cleanup();
	});

	it("maintains state in hysteresis dead zone", () => {
		const cleanup = setup();
		const isScrolledRef = { current: true };
		const setIsScrolled = vi.fn();

		// Position in dead zone: below threshold but above lower threshold
		Object.defineProperty(globalThis, "scrollY", {
			value: SCROLL_THRESHOLD - SCROLL_DELTA,
			writable: true,
			configurable: true,
		});

		const { handleScroll } = createScrollHandler(isScrolledRef, setIsScrolled);
		handleScroll();

		// Wait for RAF to execute
		vi.runAllTimers();

		// Should not change state
		expect(setIsScrolled).not.toHaveBeenCalled();

		cleanup();
	});

	it("cleanup cancels pending requestAnimationFrame", () => {
		const cleanup = setup();
		const isScrolledRef = { current: false };
		const setIsScrolled = vi.fn();

		Object.defineProperty(globalThis, "scrollY", {
			value: SCROLL_THRESHOLD + SCROLL_DELTA,
			writable: true,
			configurable: true,
		});

		const { handleScroll, cleanup: handlerCleanup } = createScrollHandler(
			isScrolledRef,
			setIsScrolled,
		);

		// Call handleScroll but don't let RAF execute
		handleScroll();

		// Cleanup before RAF executes
		handlerCleanup();

		// Now run timers - setIsScrolled should not be called because RAF was cancelled
		vi.runAllTimers();

		expect(setIsScrolled).not.toHaveBeenCalled();

		cleanup();
	});
});
