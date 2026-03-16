import type { RefObject } from "react";
import { describe, expect, it, vi } from "vitest";

import createScrollHandler from "./createScrollHandler";
import { SCROLL_HYSTERESIS, SCROLL_THRESHOLD } from "./navigation-constants";

const RAF_CALLBACK_TIME = 0;
const FAKE_RAF_ID = 1;
const OFFSET_ONE = 1;

function makeRef(value: boolean): RefObject<boolean> {
	return { current: value };
}

function setupFakeRaf(): { restore: () => void } {
	const oldRAF = globalThis.requestAnimationFrame;
	const oldCancel = globalThis.cancelAnimationFrame;

	globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
		cb(RAF_CALLBACK_TIME);
		return FAKE_RAF_ID;
	};
	vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => undefined);

	return {
		restore: () => {
			globalThis.requestAnimationFrame = oldRAF;
			globalThis.cancelAnimationFrame = oldCancel;
			vi.restoreAllMocks();
		},
	};
}

describe("createScrollHandler", () => {
	it("returns handleScroll and cleanup functions", () => {
		const { restore } = setupFakeRaf();
		try {
			let scrollYValue: number = RAF_CALLBACK_TIME;
			Object.defineProperty(globalThis, "scrollY", {
				get: () => scrollYValue,
				configurable: true,
			});

			const ref = makeRef(false);
			const setIsScrolled = vi.fn();

			const result = createScrollHandler(ref, setIsScrolled);

			expect(typeof result.handleScroll).toBe("function");
			expect(typeof result.cleanup).toBe("function");
		} finally {
			restore();
		}
	});

	it("sets isScrolled true when scrollY exceeds threshold", () => {
		const { restore } = setupFakeRaf();
		try {
			let scrollYValue: number = RAF_CALLBACK_TIME;
			Object.defineProperty(globalThis, "scrollY", {
				get: () => scrollYValue,
				configurable: true,
			});

			const ref = makeRef(false);
			const setIsScrolled = vi.fn();

			const { handleScroll } = createScrollHandler(ref, setIsScrolled);
			scrollYValue = SCROLL_THRESHOLD + OFFSET_ONE;

			handleScroll();

			expect(setIsScrolled).toHaveBeenCalledWith(true);
		} finally {
			restore();
		}
	});

	it("sets isScrolled false when scrollY is below lower threshold and was scrolled", () => {
		const { restore } = setupFakeRaf();
		try {
			const lowerThreshold = SCROLL_THRESHOLD - SCROLL_HYSTERESIS;
			let scrollYValue: number = lowerThreshold - OFFSET_ONE;
			Object.defineProperty(globalThis, "scrollY", {
				get: () => scrollYValue,
				configurable: true,
			});

			const ref = makeRef(true);
			const setIsScrolled = vi.fn();

			const { handleScroll } = createScrollHandler(ref, setIsScrolled);

			handleScroll();

			expect(setIsScrolled).toHaveBeenCalledWith(false);
		} finally {
			restore();
		}
	});

	it("cleanup cancels pending requestAnimationFrame", () => {
		const { restore } = setupFakeRaf();
		try {
			let scrollYValue: number = RAF_CALLBACK_TIME;
			Object.defineProperty(globalThis, "scrollY", {
				get: () => scrollYValue,
				configurable: true,
			});

			const ref = makeRef(false);
			const setIsScrolled = vi.fn();

			const { handleScroll, cleanup } = createScrollHandler(ref, setIsScrolled);

			handleScroll();
			cleanup();

			expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(FAKE_RAF_ID);
		} finally {
			restore();
		}
	});
});
