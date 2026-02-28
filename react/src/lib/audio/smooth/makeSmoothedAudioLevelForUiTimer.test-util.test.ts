import { describe, expect, it, vi } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import makeSmoothedAudioLevelForUiTimer from "./makeSmoothedAudioLevelForUiTimer.test-util";

const UI_INTERVAL_MS = 100;
const SMALL_INTERVAL_MS = 50;
const TICK_EPS = 1;
const MULTI_TICKS = 3;
const SECONDARY_TICKS = 2;

describe("makeSmoothedAudioLevelForUiTimer", () => {
	it("readSmoothedLevelNow increments internal level and peekSmoothedLevel reflects it", () => {
		const { audioLevel } = makeSmoothedAudioLevelForUiTimer(UI_INTERVAL_MS);
		expect(audioLevel.peekSmoothedLevel()).toBe(ZERO);
		const first = audioLevel.readSmoothedLevelNow();
		expect(first).toBeGreaterThan(ZERO);
		expect(audioLevel.peekSmoothedLevel()).toBe(first);
		const second = audioLevel.readSmoothedLevelNow();
		expect(second).toBeGreaterThan(first);
		expect(audioLevel.peekSmoothedLevel()).toBe(second);
	});

	it("startUiTimer updates levelUiValue on interval and stopUiTimer prevents further updates", () => {
		vi.useFakeTimers();
		const uiIntervalMs = SMALL_INTERVAL_MS;
		const { audioLevel } = makeSmoothedAudioLevelForUiTimer(uiIntervalMs);

		// Increment internal level before timer tick
		audioLevel.readSmoothedLevelNow();
		// Start the UI timer
		audioLevel.startUiTimer();

		// At first tick, levelUiValue should update to current internal level
		vi.advanceTimersByTime(uiIntervalMs + TICK_EPS);
		expect(audioLevel.levelUiValue).toBe(audioLevel.peekSmoothedLevel());

		// Increment internal level again, advance timer and check update
		audioLevel.readSmoothedLevelNow();
		vi.advanceTimersByTime(uiIntervalMs + TICK_EPS);
		expect(audioLevel.levelUiValue).toBe(audioLevel.peekSmoothedLevel());

		// Stop timer and ensure further advances don't change levelUiValue
		const before = audioLevel.levelUiValue;
		audioLevel.stopUiTimer();
		audioLevel.readSmoothedLevelNow();
		vi.advanceTimersByTime(uiIntervalMs * MULTI_TICKS);
		expect(audioLevel.levelUiValue).toBe(before);

		vi.useRealTimers();
	});

	it("reset clears internal level, levelUiValue and stops the timer", () => {
		vi.useFakeTimers();
		const uiIntervalMs = 30;
		const { audioLevel } = makeSmoothedAudioLevelForUiTimer(uiIntervalMs);
		audioLevel.startUiTimer();
		// Bump internal level
		audioLevel.readSmoothedLevelNow();
		vi.advanceTimersByTime(uiIntervalMs + TICK_EPS);
		expect(audioLevel.levelUiValue).toBeGreaterThan(ZERO);

		// Reset should clear everything
		audioLevel.reset();
		expect(audioLevel.levelUiValue).toBe(ZERO);
		expect(audioLevel.peekSmoothedLevel()).toBe(ZERO);

		// Advance timers and ensure no updates after reset
		audioLevel.readSmoothedLevelNow();
		vi.advanceTimersByTime(uiIntervalMs * SECONDARY_TICKS);
		expect(audioLevel.levelUiValue).toBe(ZERO);

		vi.useRealTimers();
	});
});
