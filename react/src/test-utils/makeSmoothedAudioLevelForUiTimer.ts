import type { RefObject } from "react";

import type { SmoothedAudioLevel } from "@/react/audio/useSmoothedAudioLevel";

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

	// Central helper that clears the internal timer. Place the single narrow
	// eslint-disable here so individual methods don't need repeated disables.
	function clearTimer(): void {
		if (timerId !== undefined) {
			try {
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion -- clear runtime timer that can be number or Timeout */
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
		startUiTimer(): void {
			clearTimer();
			timerId = globalThis.setInterval((): void => {
				customAudioLevel.levelUiValue = internalLevel;
			}, uiIntervalMs);
		},
		stopUiTimer(): void {
			clearTimer();
			timerId = undefined;
		},
		reset(): void {
			clearTimer();
			timerId = undefined;
			internalLevel = ZERO;
			customAudioLevel.levelUiValue = ZERO;
		},
	};

	return { audioLevel: customAudioLevel, audioLevelRef: { current: customAudioLevel } };
}
