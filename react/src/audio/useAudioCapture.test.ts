import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
	MinimalAnalyserNode,
	MinimalBaseAudioContext,
	MinimalMediaStream,
	MinimalMediaStreamAudioSourceNode,
	MinimalMediaStreamTrack,
} from "./types";

import closeAudioContextSafely from "./closeAudioContextSafely";
import createTimeDomainAnalyser from "./createTimeDomainAnalyser";
import getDisplayAudioStream from "./getDisplayAudioStream";
import getMicStreamForDevice from "./getMicStreamForDevice";
import stopMediaStreamTracks from "./stopMediaStreamTracks";
import useAudioCapture from "./useAudioCapture";

// Mock dependencies
vi.mock("./createTimeDomainAnalyser");
vi.mock("./getMicStreamForDevice");
vi.mock("./getDisplayAudioStream");
vi.mock("./stopMediaStreamTracks");
vi.mock("./closeAudioContextSafely");

const mockCreateTimeDomainAnalyser = vi.mocked(createTimeDomainAnalyser);
const mockGetMicStreamForDevice = vi.mocked(getMicStreamForDevice);
const mockGetDisplayAudioStream = vi.mocked(getDisplayAudioStream);
const mockStopMediaStreamTracks = vi.mocked(stopMediaStreamTracks);
const mockCloseAudioContextSafely = vi.mocked(closeAudioContextSafely);

// Narrow the success return type of `createTimeDomainAnalyser` for typed test stubs
type TimeDomainAnalyserSuccess = Exclude<
	Awaited<ReturnType<typeof createTimeDomainAnalyser>>,
	{ errorMessage: string }
>;

// Constants for test stubs
const FAKE_FFT_SIZE = 2048;
const FAKE_FREQUENCY_BIN_COUNT = 1024;
const FAKE_MAX_DECIBELS = -10;
const FAKE_MIN_DECIBELS = -100;
const FAKE_SMOOTHING_TIME_CONSTANT = 0.8;

/**
 * Create fake test stubs implementing AnalyserNode interface.
 */
function makeFakeAnalyserNode(context?: MinimalBaseAudioContext): MinimalAnalyserNode {
	return {
		fftSize: FAKE_FFT_SIZE,
		frequencyBinCount: FAKE_FREQUENCY_BIN_COUNT,
		maxDecibels: FAKE_MAX_DECIBELS,
		minDecibels: FAKE_MIN_DECIBELS,
		smoothingTimeConstant: FAKE_SMOOTHING_TIME_CONSTANT,
		getByteFrequencyData: vi.fn(),
		getByteTimeDomainData: vi.fn(),
		getFloatFrequencyData: vi.fn(),
		getFloatTimeDomainData: vi.fn(),
		context: context ?? { currentTime: 0 },
	};
}

/**
 * Create a fake AudioContext stub for testing.
 */
function makeFakeAudioContext(
	closeMock?: () => void,
): Pick<AudioContext, "close" | "resume"> & MinimalBaseAudioContext {
	return {
		currentTime: 0,
		close: (): Promise<void> => {
			closeMock?.();
			return Promise.resolve();
		},
		resume: async (): Promise<void> => {
			await Promise.resolve();
		},
	};
}

/**
 * Create a fake MediaStream stub for testing.
 */
function makeFakeMediaStream(hasTrack = true): MinimalMediaStream {
	const track: MinimalMediaStreamTrack = {
		stop: vi.fn(),
	};
	return {
		getTracks: (): MinimalMediaStreamTrack[] => (hasTrack ? [track] : []),
		getAudioTracks: (): MinimalMediaStreamTrack[] => (hasTrack ? [track] : []),
	};
}

describe("useAudioCapture", () => {
	const FFT_SIZE = 2048; // from implementation

	function setup(): void {
		vi.clearAllMocks();
	}

	it("startMic success wires analyser and sets status", async () => {
		setup();
		const fakeAudioContext = makeFakeAudioContext();
		const fakeAnalyser = makeFakeAnalyserNode(fakeAudioContext);
		const fakeBuffer = new Uint8Array(FFT_SIZE);
		const fakeStream = makeFakeMediaStream(true);

		const successResult: TimeDomainAnalyserSuccess = {
			audioContext: fakeAudioContext,
			source: {} as MinimalMediaStreamAudioSourceNode,
			analyser: fakeAnalyser,
			timeDomainBytes: fakeBuffer,
		};
		mockCreateTimeDomainAnalyser.mockResolvedValue(successResult);
		mockGetMicStreamForDevice.mockResolvedValue(fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic("device-1");

		expect(mockGetMicStreamForDevice).toHaveBeenCalledWith("device-1");
		expect(stream).toBe(fakeStream);
		await waitFor(() => {
			expect(result.current.status).toBe("mic-ready");
		});
		expect(result.current.currentStreamLabel).toBe("microphone (device-1)");
		expect(result.current.analyserRef.current).toBe(fakeAnalyser);
		expect(result.current.timeDomainBytesRef.current).toBe(fakeBuffer);
	});

	it("startMic rejects sets error status and message", async () => {
		setup();
		mockGetMicStreamForDevice.mockRejectedValue(new Error("boom"));

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic();

		expect(stream).toBeUndefined();
		await waitFor(() => {
			expect(result.current.status).toBe("error");
		});
		expect(result.current.errorMessage).toContain("boom");
	});

	it("startMic with no audio tracks stops and returns error", async () => {
		setup();
		const fakeStream = makeFakeMediaStream(false);
		mockGetMicStreamForDevice.mockResolvedValue(fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic();

		expect(stream).toBeUndefined();
		expect(mockStopMediaStreamTracks).toHaveBeenCalledWith(fakeStream);
		await waitFor(() => {
			expect(result.current.status).toBe("error");
		});
		expect(result.current.errorMessage).toBe("No audio track received from stream");
	});

	it("startDisplayAudio success sets tab/screen label", async () => {
		setup();
		const fakeAudioContext = makeFakeAudioContext();
		const fakeAnalyser = makeFakeAnalyserNode(fakeAudioContext);
		const fakeBuffer = new Uint8Array(FFT_SIZE);
		const fakeStream = makeFakeMediaStream(true);

		const successResult: TimeDomainAnalyserSuccess = {
			audioContext: fakeAudioContext,
			source: {} as MinimalMediaStreamAudioSourceNode,
			analyser: fakeAnalyser,
			timeDomainBytes: fakeBuffer,
		};
		mockCreateTimeDomainAnalyser.mockResolvedValue(successResult);
		mockGetDisplayAudioStream.mockResolvedValue(fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startDisplayAudio();

		expect(stream).toBe(fakeStream);
		await waitFor(() => {
			expect(result.current.status).toBe("mic-ready");
		});
		expect(result.current.currentStreamLabel).toBe("tab/screen audio");
	});

	it("stop stops tracks and closes audio context and clears refs", async () => {
		const fakeAudioContext = makeFakeAudioContext(() => undefined);
		const fakeAnalyser = makeFakeAnalyserNode(fakeAudioContext);
		const fakeBuffer = new Uint8Array(FFT_SIZE);
		const fakeStream = makeFakeMediaStream(true);

		const successResult: TimeDomainAnalyserSuccess = {
			audioContext: fakeAudioContext,
			source: {} as MinimalMediaStreamAudioSourceNode,
			analyser: fakeAnalyser,
			timeDomainBytes: fakeBuffer,
		};
		mockCreateTimeDomainAnalyser.mockResolvedValue(successResult);
		mockGetMicStreamForDevice.mockResolvedValue(fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic();
		expect(stream).toBe(fakeStream);

		await result.current.stop();

		expect(mockStopMediaStreamTracks).toHaveBeenCalledWith(fakeStream);
		expect(mockCloseAudioContextSafely).toHaveBeenCalledWith(fakeAudioContext);
		expect(result.current.analyserRef.current).toBeUndefined();
		expect(result.current.timeDomainBytesRef.current).toBeUndefined();
		await waitFor(() => {
			expect(result.current.status).toBe("stopped");
		});
	});

	it("stop with setStoppedStatus false doesn't set stopped status", async () => {
		const fakeAudioContext = makeFakeAudioContext(() => undefined);
		const fakeAnalyser = makeFakeAnalyserNode(fakeAudioContext);
		const fakeBuffer = new Uint8Array(FFT_SIZE);
		const fakeStream = makeFakeMediaStream(true);

		const successResult: TimeDomainAnalyserSuccess = {
			audioContext: fakeAudioContext,
			source: {} as MinimalMediaStreamAudioSourceNode,
			analyser: fakeAnalyser,
			timeDomainBytes: fakeBuffer,
		};
		mockCreateTimeDomainAnalyser.mockResolvedValue(successResult);
		mockGetMicStreamForDevice.mockResolvedValue(fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		await result.current.startMic();
		await result.current.stop({ setStoppedStatus: false });

		expect(result.current.status).not.toBe("stopped");
	});

	it("unmount cleanup calls stop (stops tracks)", async () => {
		const fakeAudioContext = makeFakeAudioContext(() => undefined);
		const fakeAnalyser = makeFakeAnalyserNode(fakeAudioContext);
		const fakeBuffer = new Uint8Array(FFT_SIZE);
		const fakeStream = makeFakeMediaStream(true);

		const successResult: TimeDomainAnalyserSuccess = {
			audioContext: fakeAudioContext,
			source: {} as MinimalMediaStreamAudioSourceNode,
			analyser: fakeAnalyser,
			timeDomainBytes: fakeBuffer,
		};
		mockCreateTimeDomainAnalyser.mockResolvedValue(successResult);
		mockGetMicStreamForDevice.mockResolvedValue(fakeStream);

		const { result, unmount } = renderHook(() => useAudioCapture());

		await result.current.startMic();

		unmount();

		expect(mockStopMediaStreamTracks).toHaveBeenCalledWith(fakeStream);
	});
});
