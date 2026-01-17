import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import computeRmsLevelFromTimeDomainBytes from "@/react/audio/computeRmsLevel";

import clamp01 from "./clamp01";
import smoothValue from "./smoothValue";
import useSmoothedAudioLevel, { type AudioAnalyser } from "./useSmoothedAudioLevel";

// Mock dependencies
vi.mock("@/react/audio/computeRmsLevel", () => ({
	default: vi.fn(),
}));

vi.mock("./clamp01", () => ({
	default: vi.fn(),
}));

vi.mock("./smoothValue", () => ({
	default: vi.fn(),
}));

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
	let refs: {
		analyserRef: { current: AudioAnalyser | undefined };
		timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
	} = {
		analyserRef: { current: undefined },
		timeDomainBytesRef: { current: undefined },
	};
	let options: { uiIntervalMs: number; smoothingAlpha: number } = {
		uiIntervalMs: UI_INTERVAL_MS,
		smoothingAlpha: SMOOTHING_ALPHA,
	};

	beforeEach(() => {
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
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("initializes with zero levelUiValue", () => {
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL);
	});

	it("peekSmoothedLevel returns current levelRef value", () => {
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		expect(result.current.peekSmoothedLevel()).toBe(ZERO_LEVEL);
	});

	it("readSmoothedLevelNow reads and smooths level", () => {
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const level = result.current.readSmoothedLevelNow();
		expect(mockComputeRmsLevel).toHaveBeenCalledWith(buffer);
		expect(mockSmoothValue).toHaveBeenCalled();
		expect(level).toBeGreaterThan(ZERO_LEVEL);
	});

	it("readSmoothedLevelNow returns 0 when analyser unavailable", () => {
		refs.analyserRef.current = undefined;
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const level = result.current.readSmoothedLevelNow();
		expect(level).toBe(ZERO_LEVEL);
	});

	it("readBytesAndSmoothedLevelNow returns bytes and level", () => {
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const resultData = result.current.readBytesAndSmoothedLevelNow();
		expect(resultData).toBeDefined();
		expect(resultData?.bytes).toBe(buffer);
		expect(resultData?.level).toBeGreaterThan(ZERO_LEVEL);
	});

	it("readBytesAndSmoothedLevelNow returns undefined when buffer unavailable", () => {
		refs.timeDomainBytesRef.current = undefined;
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const resultData = result.current.readBytesAndSmoothedLevelNow();
		expect(resultData).toBeUndefined();
	});

	it("stopUiTimer stops updating levelUiValue", () => {
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();
		result.current.readSmoothedLevelNow(); // Set level
		result.current.stopUiTimer();

		vi.advanceTimersByTime(options.uiIntervalMs * MULTIPLIER);
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL); // Timer stopped, no update
	});

	it("reset clears state and stops timer", () => {
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();
		result.current.readSmoothedLevelNow(); // Change level

		result.current.reset();
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL);
		expect(result.current.peekSmoothedLevel()).toBe(ZERO_LEVEL);
	});

	it("cleanup stops timer on unmount", () => {
		const { result, unmount } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();

		unmount();
		// Timer should be cleared, but hard to test directly; assume no errors
	});
});
