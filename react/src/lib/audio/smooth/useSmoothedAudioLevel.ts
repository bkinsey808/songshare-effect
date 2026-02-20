import { useEffect, useRef, useState } from "react";

import computeRmsLevelFromTimeDomainBytes from "@/react/lib/audio/computeRmsLevel";
import { ZERO } from "@/shared/constants/shared-constants";

import clamp01 from "../clamp01";
import smoothValue from "./smoothValue";

/**
 * Minimal type for audio analysers that provide time-domain data.
 * This allows for easier testing with mocks that only implement the required method.
 */
type AudioAnalyser = {
	/**
	 * Fill `array` with the analyser's time-domain samples (0..255).
	 *
	 * - **Mutates** the provided buffer in-place (non-allocating, high-frequency API).
	 * - Values are unsigned bytes in the range [0, 255].
	 * - Caller must provide a buffer sized to the analyser's expected length.
	 * - Synchronous and safe to call frequently (e.g. each animation frame).
	 */
	getByteTimeDomainData(array: Uint8Array<ArrayBuffer>): void;
	/**
	 * `context` is optional for lightweight test doubles and some minimal analyser
	 * implementations — callers that require timing information should check for
	 * presence before use.
	 */
	context?: Pick<BaseAudioContext, "currentTime" | "state">;
};

type AudioLevelRefs = {
	analyserRef: { current: AudioAnalyser | undefined };
	timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
};

type AudioLevelOptions = {
	uiIntervalMs: number;
	smoothingAlpha: number;
};

/**
 * Computes a smoothed audio level from a Web Audio analyser time-domain buffer.
 *
 * Designed for demos/visualizations where you want:
 * - A frequently-sampled "current level" (used by render loops)
 * - A lower-frequency UI value updated on an interval
 * - Simple exponential smoothing to avoid jitter
 *
 * This hook does not create or own the analyser/buffer; instead it reads them from refs
 * so the caller controls lifecycle (mic start/stop, buffer sizing, etc.).
 *
 * Notes:
 * - `startUiTimer()` is opt-in; call it when capture starts.
 * - `reset()` stops the timer and clears internal state.
 *
 * @param refs Refs to an analyser (implementing AudioAnalyser) and its reusable time-domain byte buffer.
 * @param options UI timer interval and smoothing settings.
 */
export type SmoothedAudioLevel = {
	/** Current UI-facing smoothed level (updated on interval). */
	levelUiValue: number;
	/** Return the most recent peeked smoothed level without sampling. */
	peekSmoothedLevel(): number;
	/** Read and smooth the level immediately from the analyser, returning the value. */
	readSmoothedLevelNow(): number;
	/** Read bytes and the smoothed level in a single call or `undefined` if unavailable. */
	readBytesAndSmoothedLevelNow():
		| {
				bytes: Uint8Array<ArrayBuffer>;
				level: number;
		  }
		| undefined;
	/** Start a timer that updates `levelUiValue` on the provided interval. */
	startUiTimer(): void;
	/** Stop the UI timer if running. */
	stopUiTimer(): void;
	/** Reset internal state and stop the timer. */
	reset(): void;
};

/**
 * Hook implementation: Reads analyser / buffer from refs and provides helpers.
 *
 * @param refs - Refs to the analyser and time-domain byte buffer.
 * @param options - Options controlling UI interval and smoothing.
 * @returns A `SmoothedAudioLevel` object with helpers described above.
 */
export default function useSmoothedAudioLevel(
	refs: AudioLevelRefs,
	options: AudioLevelOptions,
): SmoothedAudioLevel {
	const { analyserRef, timeDomainBytesRef } = refs;
	const { uiIntervalMs, smoothingAlpha } = options;

	// UI-facing state (updated on an interval) — kept separate from the
	// high-frequency internal value used by render loops and immediate reads.
	const [levelUiValue, setLevelUiValue] = useState<number>(ZERO);

	// Internal, synchronous source-of-truth for the smoothed level. Updated
	// immediately by `smoothLevel` and used by fast sampling paths.
	const levelRef = useRef<number>(ZERO);

	// Holds the UI timer id (if any). Cleared on stop/reset/unmount.
	const uiTimerIdRef = useRef<ReturnType<typeof globalThis.setInterval> | undefined>(undefined);

	/** Stop the UI timer if running. */
	function stopUiTimer(): void {
		const timerId = uiTimerIdRef.current;
		if (timerId === undefined) {
			return;
		}
		uiTimerIdRef.current = undefined;
		clearInterval(timerId);
	}

	/** Start the UI timer that periodically updates `levelUiValue`. */
	function startUiTimer(): void {
		stopUiTimer();
		const timerId = globalThis.setInterval(() => {
			// Read from the live `levelRef.current` (avoids stale-closure issues)
			// and push that instantaneous value into React state at the
			// lower UI update frequency.
			setLevelUiValue(levelRef.current);
		}, uiIntervalMs);
		uiTimerIdRef.current = timerId;
	}

	/**
	 * Apply exponential smoothing to a raw level value and return the smoothed result.
	 * @param nextRaw - Raw input level in [0, 1]
	 * @returns Smoothed level in [0, 1]
	 */
	function smoothLevel(nextRaw: number): number {
		// Guard the input to [0,1] to avoid analyser anomalies or out-of-range
		// values from propagating into the smoother.
		const raw = clamp01(nextRaw);
		const previous = levelRef.current;
		const smoothed = smoothValue(previous, raw, smoothingAlpha);
		// Update the synchronous source-of-truth (used by render loops / timers)
		levelRef.current = smoothed;
		return smoothed;
	}

	/**
	 * Read the analyser's current time-domain bytes into the provided buffer.
	 *
	 * Note: this function *mutates* the supplied buffer (the analyser writes
	 * into it). The caller owns buffer lifecycle and sizing (must match the
	 * analyser's expected length).
	 *
	 * @returns The buffer populated with bytes, or `undefined` if unavailable.
	 */
	function readBytesNow(): Uint8Array<ArrayBuffer> | undefined {
		const analyser = analyserRef.current;
		const bytes = timeDomainBytesRef.current;
		if (!analyser || !bytes) {
			return undefined;
		}
		analyser.getByteTimeDomainData(bytes);
		return bytes;
	}

	/**
	 * Read and smooth the level immediately from the analyser; returns 0 if unavailable.
	 * @returns Smoothed level or 0 when analyser/buffer are unavailable.
	 */
	function readSmoothedLevelNow(): number {
		const bytes = readBytesNow();
		if (!bytes) {
			return ZERO;
		}

		// Convert the analyser's raw time-domain bytes into a normalized RMS level
		// (computeRmsLevelFromTimeDomainBytes -> value in [0, 1]), then apply
		// exponential smoothing via `smoothLevel` which updates the internal
		// `levelRef` and returns the smoothed instantaneous value. This does
		// NOT update the UI interval value (`levelUiValue`) — that only changes
		// when the optional UI timer calls `setLevelUiValue(levelRef.current)`.
		return smoothLevel(computeRmsLevelFromTimeDomainBytes(bytes));
	}

	/**
	 * Read bytes and return both the bytes and the smoothed level, or `undefined`.
	 * @returns An object with `bytes` and `level` or `undefined`.
	 */
	function readBytesAndSmoothedLevelNow():
		| {
				bytes: Uint8Array<ArrayBuffer>;
				level: number;
		  }
		| undefined {
		const bytes = readBytesNow();
		if (!bytes) {
			return undefined;
		}
		return {
			bytes,
			level: smoothLevel(computeRmsLevelFromTimeDomainBytes(bytes)),
		};
	}

	/** Peek at the last smoothed level without sampling. */
	function peekSmoothedLevel(): number {
		return levelRef.current;
	}

	/** Reset internal state and stop the UI timer. */
	function reset(): void {
		// Stop UI updates and clear internal state. Note: this does *not*
		// stop or close the analyser nor zero the caller-owned buffer — the
		// hook intentionally does not manage analyser lifecycle.
		stopUiTimer();
		levelRef.current = ZERO;
		setLevelUiValue(ZERO);
	}

	// Ensure any UI timer is cleared when the hook unmounts to avoid leaks
	useEffect(
		(): (() => void) => (): void => {
			const timerId = uiTimerIdRef.current;
			if (timerId === undefined) {
				return;
			}
			uiTimerIdRef.current = undefined;
			clearInterval(timerId);
		},
		[],
	);

	return {
		levelUiValue,
		peekSmoothedLevel,
		readSmoothedLevelNow,
		readBytesAndSmoothedLevelNow,
		startUiTimer,
		stopUiTimer,
		reset,
	};
}

export type { AudioAnalyser };
