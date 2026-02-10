import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
	setMockRejectedValue,
	setMockResolvedValue,
} from "@/react/lib/test-utils/spy-import/spyHelpers";
import spyImport, { type SpyLike } from "@/react/lib/test-utils/spy-import/spyImport";

import type {
	MinimalAnalyserNode,
	MinimalBaseAudioContext,
	MinimalMediaStream,
	MinimalMediaStreamAudioSourceNode,
	MinimalMediaStreamTrack,
} from "./audio-types";
import type createTimeDomainAnalyser from "./createTimeDomainAnalyser";

import useAudioCapture from "./useAudioCapture";

function spyCreateTimeDomainAnalyser(): Promise<SpyLike> {
	return spyImport("@/react/lib/audio/createTimeDomainAnalyser");
}
function spyGetMicStreamForDevice(): Promise<SpyLike> {
	return spyImport("@/react/lib/audio/stream/getMicStreamForDevice");
}
function spyStopMediaStreamTracks(): Promise<SpyLike> {
	return spyImport("@/react/lib/audio/stream/stopMediaStreamTracks");
}
function spyCloseAudioContextSafely(): Promise<SpyLike> {
	return spyImport("@/react/lib/audio/closeAudioContextSafely");
}

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

	// Small helper: clear mocks before each test
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
		await setMockResolvedValue("@/react/lib/audio/createTimeDomainAnalyser", successResult);
		await setMockResolvedValue("@/react/lib/audio/stream/getMicStreamForDevice", fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic("device-1");

		await expect(spyGetMicStreamForDevice()).resolves.toHaveBeenCalledWith("device-1");
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
		await setMockRejectedValue("@/react/lib/audio/stream/getMicStreamForDevice", new Error("boom"));

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
		// ensure spy exists so it can be asserted against later
		await spyImport("@/react/lib/audio/stream/stopMediaStreamTracks");
		await setMockResolvedValue("@/react/lib/audio/stream/getMicStreamForDevice", fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic();

		expect(stream).toBeUndefined();
		await expect(spyStopMediaStreamTracks()).resolves.toHaveBeenCalledWith(fakeStream);
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
		await setMockResolvedValue("@/react/lib/audio/createTimeDomainAnalyser", successResult);
		await setMockResolvedValue("@/react/lib/audio/stream/getDisplayAudioStream", fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startDisplayAudio();

		expect(stream).toBe(fakeStream);
		await waitFor(() => {
			expect(result.current.status).toBe("mic-ready");
		});
		expect(result.current.currentStreamLabel).toBe("tab/screen audio");
	});

	it("stop stops tracks and closes audio context and clears refs", async () => {
		setup();
		const fakeAudioContext = makeFakeAudioContext(() => undefined);
		const fakeAnalyser = makeFakeAnalyserNode(fakeAudioContext);
		const fakeBuffer = new Uint8Array(FFT_SIZE);
		const fakeStream = makeFakeMediaStream(true);

		await spyImport("@/react/lib/audio/stream/stopMediaStreamTracks");
		await spyImport("@/react/lib/audio/closeAudioContextSafely");

		const successResult: TimeDomainAnalyserSuccess = {
			audioContext: fakeAudioContext,
			source: {} as MinimalMediaStreamAudioSourceNode,
			analyser: fakeAnalyser,
			timeDomainBytes: fakeBuffer,
		};
		await setMockResolvedValue("@/react/lib/audio/createTimeDomainAnalyser", successResult);
		await setMockResolvedValue("@/react/lib/audio/stream/getMicStreamForDevice", fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		const stream = await result.current.startMic();
		expect(stream).toBe(fakeStream);

		await result.current.stop();

		await expect(spyStopMediaStreamTracks()).resolves.toHaveBeenCalledWith(fakeStream);
		await expect(spyCloseAudioContextSafely()).resolves.toHaveBeenCalledWith(fakeAudioContext);
		expect(result.current.analyserRef.current).toBeUndefined();
		expect(result.current.timeDomainBytesRef.current).toBeUndefined();
		await waitFor(() => {
			expect(result.current.status).toBe("stopped");
		});
	});

	it("stop with setStoppedStatus false doesn't set stopped status", async () => {
		setup();
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
		await setMockResolvedValue("@/react/lib/audio/createTimeDomainAnalyser", successResult);
		await setMockResolvedValue("@/react/lib/audio/stream/getMicStreamForDevice", fakeStream);

		const { result } = renderHook(() => useAudioCapture());

		await result.current.startMic();
		await result.current.stop({ setStoppedStatus: false });

		expect(result.current.status).not.toBe("stopped");
	});

	it("unmount cleanup calls stop (stops tracks)", async () => {
		setup();
		await spyImport("@/react/lib/audio/createTimeDomainAnalyser");
		await spyImport("@/react/lib/audio/stream/getMicStreamForDevice");
		await spyImport("@/react/lib/audio/stream/stopMediaStreamTracks");
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
		await spyCreateTimeDomainAnalyser().then((spy) => {
			spy.mockResolvedValue(successResult);
			return undefined;
		});
		await spyGetMicStreamForDevice().then((spy) => {
			spy.mockResolvedValue(fakeStream);
			return undefined;
		});

		const { result, unmount } = renderHook(() => useAudioCapture());

		await result.current.startMic();

		unmount();

		await expect(spyStopMediaStreamTracks()).resolves.toHaveBeenCalledWith(fakeStream);
	});
});
