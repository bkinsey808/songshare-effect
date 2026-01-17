/**
 * Status states returned by `useAudioCapture`.
 */
export type Status =
	| "idle"
	| "requesting-mic"
	| "mic-ready"
	| "starting-render"
	| "running"
	| "stopped"
	| "error";

/**
 * A minimal interface for `MediaStreamTrack` that includes only the methods used in the codebase.
 */
export type MinimalMediaStreamTrack = Pick<MediaStreamTrack, "stop">;

/**
 * A minimal interface for `MediaStream` that includes only the methods used in the codebase.
 * This allows for easier mocking in tests without unsafe type assertions.
 */
export type MinimalMediaStream = {
	getTracks(): MinimalMediaStreamTrack[];
	getAudioTracks(): MinimalMediaStreamTrack[];
};
/**
 * A minimal interface for `MediaStreamAudioSourceNode`.
 * This is primarily stored to prevent garbage collection of the audio source.
 */
export type MinimalMediaStreamAudioSourceNode = object;

/**
 * A minimal interface for `BaseAudioContext`.
 */
export type MinimalBaseAudioContext = Pick<BaseAudioContext, "currentTime">;

/**
 * A minimal interface for `AnalyserNode`.
 */
export type MinimalAnalyserNode = Pick<
	AnalyserNode,
	| "fftSize"
	| "frequencyBinCount"
	| "maxDecibels"
	| "minDecibels"
	| "smoothingTimeConstant"
	| "getByteFrequencyData"
	| "getByteTimeDomainData"
	| "getFloatFrequencyData"
	| "getFloatTimeDomainData"
> & { context: MinimalBaseAudioContext };
