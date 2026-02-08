import { describe, expect, it, vi } from "vitest";

import type { MinimalMediaStream, MinimalMediaStreamTrack } from "./audio-types";

import createTimeDomainAnalyser from "./createTimeDomainAnalyser";

class MediaStreamMock implements MinimalMediaStream {
	private readonly tracks: MinimalMediaStreamTrack[] = [];

	public getTracks(): MinimalMediaStreamTrack[] {
		return this.tracks;
	}

	public getAudioTracks(): MinimalMediaStreamTrack[] {
		return this.tracks;
	}
}

describe("createTimeDomainAnalyser", () => {
	const FFT_SIZE = 2048;
	const SMOOTHING = 0.8;

	const SILENT_GAIN_VALUE = 0;

	it("returns error if AudioContext is not supported", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("MediaStream", MediaStreamMock);
		vi.stubGlobal("AudioContext", undefined);

		const result = await createTimeDomainAnalyser({
			stream: new MediaStream() as MinimalMediaStream,
			fftSize: FFT_SIZE,
			smoothingTimeConstant: SMOOTHING,
		});

		expect(result).toStrictEqual({ errorMessage: "This browser does not support AudioContext" });
		vi.unstubAllGlobals();
	});

	it("returns error if invalid MediaStream is provided", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("MediaStream", MediaStreamMock);
		const AudioContextMock = vi.fn().mockImplementation(function AudioContextStub() {
			return { state: "running" };
		});
		vi.stubGlobal("AudioContext", AudioContextMock);

		const result = await createTimeDomainAnalyser({
			stream: {
				getTracks: () => [],
				getAudioTracks: () => [],
			},
			fftSize: FFT_SIZE,
			smoothingTimeConstant: SMOOTHING,
		});

		expect(result).toStrictEqual({ errorMessage: "Invalid MediaStream provided" });
		vi.unstubAllGlobals();
	});

	it("creates analyser and returns correct buffer length", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("MediaStream", MediaStreamMock);

		const mockAnalyser = { fftSize: 0, smoothingTimeConstant: 0, connect: vi.fn() };
		const mockSource = { connect: vi.fn() };
		const mockGain = { gain: { value: 1 }, connect: vi.fn() };
		const mockContext = {
			createMediaStreamSource: vi.fn().mockReturnValue(mockSource),
			createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
			createGain: vi.fn().mockReturnValue(mockGain),
			destination: { id: "destination" },
			state: "running",
			resume: vi.fn().mockResolvedValue(undefined),
		};

		const AudioContextMock = vi.fn().mockImplementation(function AudioContextStub(this: object) {
			Object.assign(this, mockContext);
			return mockContext;
		});

		vi.stubGlobal("AudioContext", AudioContextMock);

		const stream = new MediaStream() as MinimalMediaStream;
		const result = await createTimeDomainAnalyser({
			stream,
			fftSize: FFT_SIZE,
			smoothingTimeConstant: SMOOTHING,
		});

		expect("errorMessage" in result).toBe(false);
		expect("timeDomainBytes" in result).toBe(true);
		vi.unstubAllGlobals();
	});

	it("configures nodes and connections correctly", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("MediaStream", MediaStreamMock);

		const mockAnalyser = { fftSize: 0, smoothingTimeConstant: 0, connect: vi.fn() };
		const mockSource = { connect: vi.fn() };
		const mockGain = { gain: { value: 1 }, connect: vi.fn() };
		const mockContext = {
			createMediaStreamSource: vi.fn().mockReturnValue(mockSource),
			createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
			createGain: vi.fn().mockReturnValue(mockGain),
			destination: { id: "destination" },
			state: "running",
			resume: vi.fn().mockResolvedValue(undefined),
		};

		const AudioContextMock = vi.fn().mockImplementation(function AudioContextStub(this: object) {
			Object.assign(this, mockContext);
			return mockContext;
		});

		vi.stubGlobal("AudioContext", AudioContextMock);

		const stream = new MediaStream() as MinimalMediaStream;
		await createTimeDomainAnalyser({ stream, fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING });

		expect(AudioContextMock).toHaveBeenCalledWith();
		expect(mockContext.createMediaStreamSource).toHaveBeenCalledWith(stream);
		expect(mockAnalyser).toMatchObject({ fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING });
		expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser);
		expect(mockGain.gain.value).toBe(SILENT_GAIN_VALUE);
		vi.unstubAllGlobals();
	});

	it("resumes context if suspended", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("MediaStream", MediaStreamMock);

		const mockContext = {
			createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
			createAnalyser: vi.fn().mockReturnValue({ connect: vi.fn() }),
			createGain: vi.fn().mockReturnValue({ gain: { value: 1 }, connect: vi.fn() }),
			destination: { id: "destination" },
			state: "suspended",
			resume: vi.fn().mockResolvedValue(undefined),
		};

		const AudioContextMock = vi.fn().mockImplementation(function AudioContextStub(this: object) {
			Object.assign(this, mockContext);
			return mockContext;
		});

		vi.stubGlobal("AudioContext", AudioContextMock);

		await createTimeDomainAnalyser({
			stream: new MediaStream() as MinimalMediaStream,
			fftSize: FFT_SIZE,
			smoothingTimeConstant: SMOOTHING,
		});

		expect(mockContext.resume).toHaveBeenCalledWith();
		vi.unstubAllGlobals();
	});
});
