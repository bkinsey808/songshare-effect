import { useCallback, useEffect, useRef, useState } from "react";

import type {
	MinimalAnalyserNode,
	MinimalMediaStream,
	MinimalMediaStreamAudioSourceNode,
	Status,
} from "./types";

import closeAudioContextSafely from "./closeAudioContextSafely";
import createTimeDomainAnalyser from "./createTimeDomainAnalyser";
import getDisplayAudioStream from "./getDisplayAudioStream";
import getMicStreamForDevice from "./getMicStreamForDevice";
import stopMediaStreamTracks from "./stopMediaStreamTracks";

const ZERO = 0;
const ONE = 1;
const FFT_SIZE = 2048;
const SMOOTHING_TIME_CONSTANT = 0.85;

/** Wait for a specified number of milliseconds. */
function delay(ms: number): Promise<void> {
	// oxlint-disable-next-line promise/avoid-new
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/** Result object returned by the `useAudioCapture` hook. */
type UseAudioCaptureResult = {
	analyserRef: {
		current:
			| Pick<AnalyserNode, "fftSize" | "frequencyBinCount" | "getByteTimeDomainData">
			| undefined;
	};
	timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
	/**
	 * Start microphone capture for the given device id (or default if omitted).
	 * @param deviceId - Optional device id or "default" value.
	 */
	startMic: (deviceId?: string) => Promise<MinimalMediaStream | undefined>;
	/** Start capture from the currently visible tab/screen (display audio). */
	startDisplayAudio: () => Promise<MinimalMediaStream | undefined>;
	/** Stop any ongoing capture and optionally avoid setting the stopped status. */
	stop: (options?: { setStoppedStatus?: boolean }) => Promise<void>;
	status: Status;
	errorMessage: string | undefined;
	audioInputDevicesRefreshKey: number;
	currentStreamLabel: string | undefined;
};

/**
 * React hook that manages audio capture lifecycle and provides access to a
 * configured `AnalyserNode` and a reusable time-domain byte buffer.
 *
 * The hook does not automatically start capture; call `startMic()` or
 * `startDisplayAudio()` to begin. Use `stop()` to stop capture and clean up.
 *
 * @returns An object containing refs, status, and lifecycle helpers.
 */
export default function useAudioCapture(): UseAudioCaptureResult {
	const analyserRef = useRef<MinimalAnalyserNode | undefined>(undefined);
	const timeDomainBytesRef = useRef<Uint8Array<ArrayBuffer> | undefined>(undefined);
	const mediaStreamRef = useRef<MinimalMediaStream | undefined>(undefined);
	const sourceNodeRef = useRef<MinimalMediaStreamAudioSourceNode | undefined>(undefined);
	const audioContextRef = useRef<Pick<AudioContext, "close" | "resume"> | undefined>(undefined);

	const [status, setStatus] = useState<Status>("idle");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
	const [audioInputDevicesRefreshKey, setAudioInputDevicesRefreshKey] = useState<number>(ZERO);
	const [currentStreamLabel, setCurrentStreamLabel] = useState<string | undefined>(undefined);

	/**
	 * Stop capture and perform cleanup.
	 *
	 * @param options.setStoppedStatus - If `false` the hook will not set the status to "stopped".
	 */
	const stop = useCallback(
		async (options?: { setStoppedStatus?: boolean }): Promise<void> => {
			const stream = mediaStreamRef.current;
			if (stream) {
				stopMediaStreamTracks(stream);
				mediaStreamRef.current = undefined;
			}

			analyserRef.current = undefined;
			timeDomainBytesRef.current = undefined;

			const audioContext = audioContextRef.current;
			if (audioContext) {
				audioContextRef.current = undefined;
				sourceNodeRef.current = undefined;
				await closeAudioContextSafely(audioContext);
			}

			setErrorMessage(undefined);
			setCurrentStreamLabel(undefined);
			if (options?.setStoppedStatus !== false) {
				setStatus("stopped");
			}
		},
		[setStatus, setErrorMessage, setCurrentStreamLabel],
	);

	/**
	 * Internal helper to start a stream and wire up analyser state.
	 *
	 * @param getStream - Function returning a `MediaStream` promise.
	 * @param streamLabel - Human-readable label for the current stream.
	 */
	const startStream = useCallback(
		async (
			getStream: () => Promise<MinimalMediaStream>,
			label: string,
		): Promise<MinimalMediaStream | undefined> => {
			setCurrentStreamLabel(label);
			setErrorMessage(undefined);
			setStatus("requesting-mic");

			let stream: MinimalMediaStream | undefined = undefined;
			try {
				stream = await getStream();
			} catch (error) {
				await stop({ setStoppedStatus: false });
				setErrorMessage(error instanceof Error ? error.message : String(error));
				setStatus("error");
				return undefined;
			}

			if (stream === undefined) {
				return undefined;
			}

			if (stream.getAudioTracks().length === ZERO) {
				await stop({ setStoppedStatus: false });
				stopMediaStreamTracks(stream);
				setErrorMessage("No audio track received from stream");
				setStatus("error");
				return undefined;
			}

			mediaStreamRef.current = stream;
			setAudioInputDevicesRefreshKey((prevKey) => prevKey + ONE);

			// [Attempt 5] Add a small delay for the hardware/OS to "warm up"
			const WARMUP_DELAY_MS = 200;
			await delay(WARMUP_DELAY_MS);

			const analyserResult = await createTimeDomainAnalyser({
				stream,
				fftSize: FFT_SIZE,
				smoothingTimeConstant: SMOOTHING_TIME_CONSTANT,
			});
			if ("errorMessage" in analyserResult) {
				await stop({ setStoppedStatus: false });
				setErrorMessage(analyserResult.errorMessage);
				setStatus("error");
				return undefined;
			}

			audioContextRef.current = analyserResult.audioContext;
			sourceNodeRef.current = analyserResult.source;
			analyserRef.current = analyserResult.analyser;
			timeDomainBytesRef.current = analyserResult.timeDomainBytes;

			setStatus("mic-ready");

			return stream;
		},
		[stop, setStatus, setErrorMessage, setCurrentStreamLabel],
	);

	/**
	 * Start microphone capture for an optional device id.
	 * @param deviceId - Optional device id or "default" to use the default device.
	 */
	const startMic = useCallback(
		(deviceId?: string): Promise<MinimalMediaStream | undefined> =>
			startStream(
				() => getMicStreamForDevice(deviceId),
				deviceId === undefined || deviceId === "default"
					? "microphone"
					: `microphone (${deviceId})`,
			),
		[startStream],
	);

	/** Start display (tab/screen) audio capture. */
	const startDisplayAudio = useCallback(
		(): Promise<MinimalMediaStream | undefined> =>
			startStream(() => getDisplayAudioStream(), "tab/screen audio"),
		[startStream],
	);

	useEffect(() => (): void => void stop(), [stop]);

	// React Compiler automatically memoizes this object
	return {
		analyserRef,
		timeDomainBytesRef,
		startMic,
		startDisplayAudio,
		stop,
		status,
		errorMessage,
		audioInputDevicesRefreshKey,
		currentStreamLabel,
	};
}
