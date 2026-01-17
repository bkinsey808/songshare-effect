import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import computeRmsLevelFromTimeDomainBytes from "@/react/audio/computeRmsLevel";

import clamp01 from "./clamp01";
import smoothValue from "./smoothValue";
import useSmoothedAudioLevel, { type AudioAnalyser } from "./useSmoothedAudioLevel";

// Mock dependencies
vi.mock("@/react/audio/computeRmsLevel");
vi.mock("./clamp01");
vi.mock("./smoothValue");

const mockComputeRmsLevel = vi.mocked(computeRmsLevelFromTimeDomainBytes);
const mockClamp01 = vi.mocked(clamp01);
const mockSmoothValue = vi.mocked(smoothValue);

// Constants for test values
const BUFFER_SIZE = 1024;
const MOCK_LEVEL = 0.8;
const SMOOTHING_ALPHA = 0.5;
const UI_INTERVAL_MS = 100;
const ZERO_LEVEL = 0;
const MULTIPLIER = 2;
const ONE = 1;

describe("useSmoothedAudioLevel", () => {
	let analyser: AudioAnalyser | undefined = undefined;
	let buffer: Uint8Array<ArrayBuffer> | undefined = undefined;
	/* eslint-disable-next-line init-declarations */
	let refs: {
		analyserRef: { current: AudioAnalyser | undefined };
		timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
	};
	/* eslint-disable-next-line init-declarations */
	let options: { uiIntervalMs: number; smoothingAlpha: number };

	function setup(): void {
		vi.useFakeTimers();
		analyser = {
			getByteTimeDomainData: vi.fn(),
			context: {
				currentTime: 0,
				state: "running",
			},
		};
		buffer = new Uint8Array(BUFFER_SIZE);
		refs = {
			analyserRef: { current: analyser },
			timeDomainBytesRef: { current: buffer },
		};
		options = { uiIntervalMs: UI_INTERVAL_MS, smoothingAlpha: SMOOTHING_ALPHA };

		mockComputeRmsLevel.mockReturnValue(MOCK_LEVEL);
		mockClamp01.mockImplementation((value) => value);
		mockSmoothValue.mockImplementation((prev, raw, alpha) => raw * alpha + prev * (ONE - alpha));
	}

	it("initializes with zero levelUiValue", () => {
		setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL);
	});

	it("peekSmoothedLevel returns current levelRef value", () => {
		setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		expect(result.current.peekSmoothedLevel()).toBe(ZERO_LEVEL);
	});

	it("readSmoothedLevelNow reads and smooths level", () => {
		setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const level = result.current.readSmoothedLevelNow();
		expect(mockComputeRmsLevel).toHaveBeenCalledWith(buffer);
		expect(mockSmoothValue).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			SMOOTHING_ALPHA,
		);
		expect(level).toBeGreaterThan(ZERO_LEVEL);
	});

	it("readSmoothedLevelNow returns 0 when analyser unavailable", () => {
		setup();
		refs.analyserRef.current = undefined;
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const level = result.current.readSmoothedLevelNow();
		expect(level).toBe(ZERO_LEVEL);
	});

	it("readBytesAndSmoothedLevelNow returns bytes and level", () => {
		setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const resultData = result.current.readBytesAndSmoothedLevelNow();
		expect(resultData).toBeDefined();
		expect(resultData?.bytes).toBe(buffer);
		expect(resultData?.level).toBeGreaterThan(ZERO_LEVEL);
	});

	it("readBytesAndSmoothedLevelNow returns undefined when buffer unavailable", () => {
		setup();
		refs.timeDomainBytesRef.current = undefined;
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const resultData = result.current.readBytesAndSmoothedLevelNow();
		expect(resultData).toBeUndefined();
	});

	it("stopUiTimer stops updating levelUiValue", () => {
		setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();
		result.current.readSmoothedLevelNow(); // Set level
		result.current.stopUiTimer();

		vi.advanceTimersByTime(options.uiIntervalMs * MULTIPLIER);
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL); // Timer stopped, no update
	});

	it("reset clears state and stops timer", () => {
		setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		// cleanup
		vi.useRealTimers();
		vi.clearAllMocks();
		result.current.startUiTimer();
		result.current.readSmoothedLevelNow(); // Change level

		result.current.reset();
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL);
		expect(result.current.peekSmoothedLevel()).toBe(ZERO_LEVEL);
	});

	it("cleanup stops timer on unmount", () => {
		setup();
		const { result, unmount } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();

		expect(() => {
			unmount();
		}).not.toThrow();
		vi.useRealTimers();
		vi.clearAllMocks();
	});
});
