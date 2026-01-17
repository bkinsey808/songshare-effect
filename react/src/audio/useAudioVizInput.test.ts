import type { RefObject } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SmoothedAudioLevel } from "./useSmoothedAudioLevel";

import useAudioCapture from "./useAudioCapture";
import useAudioVizInput from "./useAudioVizInput";
import useSmoothedAudioLevelRef from "./useSmoothedAudioLevelRef";

// Mock dependencies
vi.mock("./useAudioCapture", () => ({
	default: vi.fn(),
}));

vi.mock("./useSmoothedAudioLevelRef", () => ({
	default: vi.fn(),
}));

const mockUseAudioCapture = vi.mocked(useAudioCapture);
const mockUseSmoothedAudioLevelRef = vi.mocked(useSmoothedAudioLevelRef);

describe("useAudioVizInput", () => {
	const defaultOptions = {
		uiIntervalMs: 100,
		smoothingAlpha: 0.5,
	};

	const LEVEL_UI_VALUE = 0.5;
	const PEEK_LEVEL = 0.3;
	const READ_LEVEL = 0.7;
	const BYTES_LEVEL = 0.6;
	const FFT_SIZE = 1024;
	const REFRESH_KEY = 42;
	const ZERO = 0;
	const SELECTED_DEVICE_ID = "device-123";
	const MIC_STREAM_ID = "stream-123";
	const DEFAULT_DEVICE_ID = "default";
	const CUSTOM_DEVICE_ID = "custom-device";
	const CUSTOM_STREAM_ID = "stream-456";
	const DISPLAY_STREAM_ID = "display-stream";

	const mockAudioCapture = {
		analyserRef: { current: undefined },
		timeDomainBytesRef: { current: undefined },
		startMic: vi.fn(),
		startDisplayAudio: vi.fn(),
		stop: vi.fn(),
		status: "idle" as const,
		errorMessage: undefined,
		audioInputDevicesRefreshKey: ZERO,
		currentStreamLabel: undefined,
	};

	const mockPeekSmoothedLevel = vi.fn(() => PEEK_LEVEL);
	const mockReadSmoothedLevelNow = vi.fn(() => READ_LEVEL);
	const mockReadBytesAndSmoothedLevelNow = vi.fn(() => ({
		bytes: new Uint8Array(FFT_SIZE),
		level: BYTES_LEVEL,
	}));
	const mockStartUiTimer = vi.fn();
	const mockStopUiTimer = vi.fn();
	const mockReset = vi.fn();

	const mockAudioLevel: SmoothedAudioLevel = {
		levelUiValue: LEVEL_UI_VALUE,
		peekSmoothedLevel: mockPeekSmoothedLevel,
		readSmoothedLevelNow: mockReadSmoothedLevelNow,
		readBytesAndSmoothedLevelNow: mockReadBytesAndSmoothedLevelNow,
		startUiTimer: mockStartUiTimer,
		stopUiTimer: mockStopUiTimer,
		reset: mockReset,
	};

	const mockAudioLevelRef: RefObject<SmoothedAudioLevel | undefined> = { current: mockAudioLevel };

	beforeEach(() => {
		vi.clearAllMocks();

		// Ensure the audio level ref points to the mock before each test
		mockAudioLevelRef.current = mockAudioLevel;

		mockUseAudioCapture.mockReturnValue(mockAudioCapture);
		mockUseSmoothedAudioLevelRef.mockReturnValue({
			audioLevel: mockAudioLevel,
			audioLevelRef: mockAudioLevelRef,
		});
	});

	it("initializes with default state", () => {
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		expect(result.current.selectedAudioInputDeviceId).toBe(DEFAULT_DEVICE_ID);
		expect(result.current.levelUiValue).toBe(LEVEL_UI_VALUE);
		expect(result.current.status).toBe("idle");
		expect(result.current.errorMessage).toBeUndefined();
		expect(result.current.audioInputDevicesRefreshKey).toBe(ZERO);
		expect(result.current.currentStreamLabel).toBeUndefined();
	});

	it("allows setting selected audio input device", async () => {
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		result.current.setSelectedAudioInputDeviceId(SELECTED_DEVICE_ID);

		await waitFor(() => {
			expect(result.current.selectedAudioInputDeviceId).toBe(SELECTED_DEVICE_ID);
		});
	});

	it("starts microphone capture successfully", async () => {
		const mockStream = { id: MIC_STREAM_ID };
		mockAudioCapture.startMic.mockResolvedValue(mockStream);

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const stream = await result.current.startMic();

		expect(mockAudioCapture.startMic).toHaveBeenCalledWith(DEFAULT_DEVICE_ID);
		expect(mockStartUiTimer).toHaveBeenCalled();
		expect(mockReadSmoothedLevelNow).toHaveBeenCalled();
		expect(stream).toBe(mockStream);
	});

	it("starts microphone capture with custom device ID", async () => {
		const mockStream = { id: CUSTOM_STREAM_ID };
		mockAudioCapture.startMic.mockResolvedValue(mockStream);

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));
		result.current.setSelectedAudioInputDeviceId(CUSTOM_DEVICE_ID);

		await waitFor(() => {
			expect(result.current.selectedAudioInputDeviceId).toBe(CUSTOM_DEVICE_ID);
		});

		const stream = await result.current.startMic();

		expect(mockAudioCapture.startMic).toHaveBeenCalledWith(CUSTOM_DEVICE_ID);
		expect(stream).toBe(mockStream);
	});

	it("handles microphone capture failure", async () => {
		mockAudioCapture.startMic.mockResolvedValue(undefined);

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const stream = await result.current.startMic();

		expect(mockAudioCapture.startMic).toHaveBeenCalledWith(DEFAULT_DEVICE_ID);
		expect(mockStartUiTimer).not.toHaveBeenCalled();
		expect(mockReadSmoothedLevelNow).not.toHaveBeenCalled();
		expect(stream).toBeUndefined();
	});

	it("starts display audio capture successfully", async () => {
		const mockStream = { id: DISPLAY_STREAM_ID };
		mockAudioCapture.startDisplayAudio.mockResolvedValue(mockStream);

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const stream = await result.current.startDeviceAudio();

		expect(mockAudioCapture.startDisplayAudio).toHaveBeenCalled();
		expect(mockStartUiTimer).toHaveBeenCalled();
		expect(mockReadSmoothedLevelNow).toHaveBeenCalled();
		expect(stream).toBe(mockStream);
	});

	it("handles display audio capture failure", async () => {
		mockAudioCapture.startDisplayAudio.mockResolvedValue(undefined);

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const stream = await result.current.startDeviceAudio();

		expect(mockAudioCapture.startDisplayAudio).toHaveBeenCalled();
		expect(mockStartUiTimer).not.toHaveBeenCalled();
		expect(mockReadSmoothedLevelNow).not.toHaveBeenCalled();
		expect(stream).toBeUndefined();
	});

	it("stops capture with default options", async () => {
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		await result.current.stop();

		expect(mockReset).toHaveBeenCalled();
		expect(mockAudioCapture.stop).toHaveBeenCalledWith();
	});

	it("stops capture with custom options", async () => {
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		await result.current.stop({ setStoppedStatus: false });

		expect(mockReset).toHaveBeenCalled();
		expect(mockAudioCapture.stop).toHaveBeenCalledWith({ setStoppedStatus: false });
	});

	it("provides audio level methods", () => {
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		result.current.startLevelUiTimer();
		expect(mockStartUiTimer).toHaveBeenCalled();

		result.current.stopLevelUiTimer();
		expect(mockStopUiTimer).toHaveBeenCalled();

		const level = result.current.readSmoothedLevelNow();
		expect(mockReadSmoothedLevelNow).toHaveBeenCalled();
		expect(level).toBe(READ_LEVEL);

		const bytesAndLevel = result.current.readBytesAndSmoothedLevelNow();
		expect(mockReadBytesAndSmoothedLevelNow).toHaveBeenCalled();
		expect(bytesAndLevel?.bytes).toBeInstanceOf(Uint8Array);
		expect(bytesAndLevel?.level).toBe(BYTES_LEVEL);

		result.current.resetLevel();
		expect(mockReset).toHaveBeenCalled();
	});

	it("returns 0 for readSmoothedLevelNow when audioLevelRef is undefined", () => {
		mockAudioLevelRef.current = undefined;
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const level = result.current.readSmoothedLevelNow();

		expect(level).toBe(ZERO);
	});

	it("returns undefined for readBytesAndSmoothedLevelNow when audioLevelRef is undefined", () => {
		mockAudioLevelRef.current = undefined;
		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const resultData = result.current.readBytesAndSmoothedLevelNow();

		expect(resultData).toBeUndefined();
	});

	it("surfaces audio capture status and error information", () => {
		Object.assign(mockAudioCapture, {
			status: "running" as const,
			errorMessage: "Test error",
			currentStreamLabel: "Microphone (Built-in)",
		});

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		expect(result.current.status).toBe("running");
		expect(result.current.errorMessage).toBe("Test error");
		expect(result.current.currentStreamLabel).toBe("Microphone (Built-in)");
	});

	it("surfaces audio input devices refresh key", () => {
		Object.assign(mockAudioCapture, {
			audioInputDevicesRefreshKey: REFRESH_KEY,
		});

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		expect(result.current.audioInputDevicesRefreshKey).toBe(REFRESH_KEY);
	});

	it("passes options to useSmoothedAudioLevelRef", () => {
		const customOptions = {
			uiIntervalMs: 200,
			smoothingAlpha: 0.8,
		};

		renderHook(() => useAudioVizInput(customOptions));

		expect(mockUseSmoothedAudioLevelRef).toHaveBeenCalledWith(
			{
				analyserRef: mockAudioCapture.analyserRef,
				timeDomainBytesRef: mockAudioCapture.timeDomainBytesRef,
			},
			customOptions,
		);
	});

	it("handles audio level ref being undefined gracefully", () => {
		mockAudioLevelRef.current = undefined;

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		// These should not throw
		expect(() => {
			result.current.startLevelUiTimer();
		}).not.toThrow();
		expect(() => {
			result.current.stopLevelUiTimer();
		}).not.toThrow();
		expect(() => {
			result.current.resetLevel();
		}).not.toThrow();
	});

	it("stop is idempotent and safe to call multiple times", async () => {
		const mockStream = { id: MIC_STREAM_ID };
		mockAudioCapture.startMic.mockResolvedValue(mockStream);

		const { result } = renderHook(() => useAudioVizInput(defaultOptions));

		const stream = await result.current.startMic();
		expect(mockAudioCapture.startMic).toHaveBeenCalledWith(DEFAULT_DEVICE_ID);
		expect(stream).toBe(mockStream);

		// startMic should have started the UI timer
		expect(mockStartUiTimer).toHaveBeenCalled();
		expect(mockReset).not.toHaveBeenCalled();
		expect(mockAudioCapture.stop).not.toHaveBeenCalled();

		await result.current.stop();
		const ONCE = 1;
		expect(mockReset).toHaveBeenCalledTimes(ONCE);
		expect(mockAudioCapture.stop).toHaveBeenCalledTimes(ONCE);

		await result.current.stop();

		const EXPECTED_CALLS = 2;
		expect(mockReset).toHaveBeenCalledTimes(EXPECTED_CALLS);
		expect(mockAudioCapture.stop).toHaveBeenCalledTimes(EXPECTED_CALLS);
	});

	it("unmounting does not auto-stop and stop works after unmount", async () => {
		const mockStream = { id: MIC_STREAM_ID };
		mockAudioCapture.startMic.mockResolvedValue(mockStream);

		const { result, unmount } = renderHook(() => useAudioVizInput(defaultOptions));

		const stream = await result.current.startMic();
		expect(mockAudioCapture.startMic).toHaveBeenCalledWith(DEFAULT_DEVICE_ID);
		expect(stream).toBe(mockStream);

		// startMic should have started the UI timer
		expect(mockStartUiTimer).toHaveBeenCalled();

		// Unmount should not automatically stop capture
		unmount();
		expect(mockAudioCapture.stop).not.toHaveBeenCalled();

		// Calling stop afterwards should still work
		await result.current.stop();
		const CALLED_AT_LEAST_ONCE = 1;
		expect(mockReset).toHaveBeenCalledTimes(CALLED_AT_LEAST_ONCE);
		expect(mockAudioCapture.stop).toHaveBeenCalledTimes(CALLED_AT_LEAST_ONCE);
	});

	it("UI timer reflects smoothed level after readings (integration)", async () => {
		vi.useFakeTimers();

		// Create a simple audioLevel implementation that mimics the smoothing + UI timer
		const SMOOTH_STEP = 0.5;
		let internalLevel = 0;
		let timerId: ReturnType<typeof globalThis.setInterval> | undefined = undefined;
		const customAudioLevel = {
			levelUiValue: 0,
			peekSmoothedLevel: vi.fn(() => internalLevel),
			readSmoothedLevelNow: vi.fn(() => {
				internalLevel += SMOOTH_STEP;
				return internalLevel;
			}),
			readBytesAndSmoothedLevelNow: vi.fn(() => undefined),
			startUiTimer(): void {
				if (timerId !== undefined) {
					clearInterval(timerId);
				}
				timerId = globalThis.setInterval((): void => {
					customAudioLevel.levelUiValue = internalLevel;
				}, defaultOptions.uiIntervalMs);
			},
			stopUiTimer(): void {
				if (timerId !== undefined) {
					clearInterval(timerId);
					timerId = undefined;
				}
			},
			reset(): void {
				if (timerId !== undefined) {
					clearInterval(timerId);
				}
				timerId = undefined;
				internalLevel = ZERO;
				customAudioLevel.levelUiValue = ZERO;
			},
		};

		// Use a deterministic custom `SmoothedAudioLevel` instance for this integration-style test
		// so we can avoid dynamic imports and still exercise the UI timer logic.
		const customAudioLevelRef = { current: customAudioLevel };
		mockUseSmoothedAudioLevelRef.mockReturnValueOnce({
			audioLevel: customAudioLevel,
			audioLevelRef: customAudioLevelRef,
		});

		const { result, rerender } = renderHook(() => useAudioVizInput(defaultOptions));

		// Start capture -> startUiTimer + initial read
		mockAudioCapture.startMic.mockResolvedValue({ id: MIC_STREAM_ID });
		await result.current.startMic();

		// Advance timers so the UI timer applies the current smoothed level
		vi.advanceTimersByTime(defaultOptions.uiIntervalMs);
		rerender();
		const MIN_POSITIVE = 0.001;
		expect(result.current.levelUiValue ?? MIN_POSITIVE).toBeGreaterThan(MIN_POSITIVE);

		const firstLevel = result.current.levelUiValue ?? MIN_POSITIVE;

		// Simulate a second reading that increases the smoothed level
		const returned = result.current.readSmoothedLevelNow();
		expect(returned).toBeGreaterThan(firstLevel);

		vi.useRealTimers();
	});
});
