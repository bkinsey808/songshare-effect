import type { RefObject } from "react";

import type { SmoothedAudioLevel } from "@/react/lib/audio/smooth/useSmoothedAudioLevel";
import { ZERO } from "@/shared/constants/shared-constants";

/**
 * Create a mock `SmoothedAudioLevel` with a controllable UI timer for tests.
 *
 * @param uiIntervalMs - Interval in ms used for the UI timer in tests
 * @returns An object containing the `audioLevel` and a `RefObject` pointing to it
 */
export default function makeSmoothedAudioLevelForUiTimer(uiIntervalMs: number): {
	audioLevel: SmoothedAudioLevel;
	audioLevelRef: RefObject<SmoothedAudioLevel>;
} {
	const SMOOTH_STEP = 0.5;
	let internalLevel = ZERO;
	let timerId: ReturnType<typeof globalThis.setInterval> | undefined = undefined;

	/**
	 * Clear the internal UI timer if installed.
	 *
	 * This centralizes the narrow timer-related lint exception so individual
	 * methods do not need repeated disables.
	 *
	 * @returns void
	 */
	function clearTimer(): void {
		if (timerId !== undefined) {
			try {
				/* oxlint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion -- clear runtime timer that can be number or Timeout */
				clearInterval(timerId as unknown as ReturnType<typeof globalThis.setInterval>);
			} catch {
				// noop
			}
		}
	}

	const customAudioLevel: SmoothedAudioLevel = {
		levelUiValue: ZERO,
		peekSmoothedLevel: () => internalLevel,
		readSmoothedLevelNow: () => {
			internalLevel += SMOOTH_STEP;
			return internalLevel;
		},
		readBytesAndSmoothedLevelNow: () => undefined,
		/**
		 * Start the mock UI timer that updates `levelUiValue` periodically.
		 *
		 * @returns void
		 */
		startUiTimer(): void {
			clearTimer();
			timerId = globalThis.setInterval((): void => {
				customAudioLevel.levelUiValue = internalLevel;
			}, uiIntervalMs);
		},
		/**
		 * Stop the mock UI timer.
		 *
		 * @returns void
		 */
		stopUiTimer(): void {
			clearTimer();
			timerId = undefined;
		},
		/**
		 * Reset the mock audio level internal state and stop timers.
		 *
		 * @returns void
		 */
		reset(): void {
			clearTimer();
			timerId = undefined;
			internalLevel = ZERO;
			customAudioLevel.levelUiValue = ZERO;
		},
	};

	return { audioLevel: customAudioLevel, audioLevelRef: { current: customAudioLevel } };
}
