import { useEffect, useRef, useState } from "react";

import computeRmsLevelFromTimeDomainBytes from "@/react/audio/computeRmsLevel";
import { clamp01, smoothValue } from "@/react/typegpu/numeric";

type AudioLevelRefs = {
	analyserRef: { current: AnalyserNode | undefined };
	timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
};

type AudioLevelOptions = {
	uiIntervalMs: number;
	smoothingAlpha: number;
};

const ZERO = 0;

/**
 * Computes a smoothed audio level from a Web Audio `AnalyserNode` time-domain buffer.
 *
 * Designed for demos/visualizations where you want:
 * - A frequently-sampled “current level” (used by render loops)
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
 * @param refs Refs to an analyser node and its reusable time-domain byte buffer.
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

	const [levelUiValue, setLevelUiValue] = useState<number>(ZERO);

	const levelRef = useRef<number>(ZERO);
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
		const raw = clamp01(nextRaw);
		const previous = levelRef.current;
		const smoothed = smoothValue(previous, raw, smoothingAlpha);
		levelRef.current = smoothed;
		return smoothed;
	}

	/**
	 * Read the analyser's current time-domain bytes into the provided buffer.
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
		stopUiTimer();
		levelRef.current = ZERO;
		setLevelUiValue(ZERO);
	}

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
