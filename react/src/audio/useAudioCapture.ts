import { useEffect, useRef, useState } from "react";

import closeAudioContextSafely from "./closeAudioContextSafely";
import createTimeDomainAnalyser from "./createTimeDomainAnalyser";
import getDisplayAudioStream from "./getDisplayAudioStream";
import getMicStreamForDevice from "./getMicStreamForDevice";
import stopMediaStreamTracks from "./stopMediaStreamTracks";

const ZERO = 0;
const ONE = 1;
const FFT_SIZE = 2048;
const SMOOTHING_TIME_CONSTANT = 0.85;

/**
 * Status states returned by `useAudioCapture`.
 */
type Status =
	| "idle"
	| "requesting-mic"
	| "mic-ready"
	| "starting-render"
	| "running"
	| "stopped"
	| "error";

/**
 * Result object returned by the `useAudioCapture` hook.
 */
type UseAudioCaptureResult = {
	analyserRef: { current: AnalyserNode | undefined };
	timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
	/**
	 * Start microphone capture for the given device id (or default if omitted).
	 * @param deviceId - Optional device id or "default" value.
	 */
	startMic(deviceId?: string): Promise<MediaStream | undefined>;
	/** Start capture from the currently visible tab/screen (display audio). */
	startDisplayAudio(): Promise<MediaStream | undefined>;
	/** Stop any ongoing capture and optionally avoid setting the stopped status. */
	stop(options?: { setStoppedStatus?: boolean }): Promise<void>;
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
	const analyserRef = useRef<AnalyserNode | undefined>(undefined);
	const timeDomainBytesRef = useRef<Uint8Array<ArrayBuffer> | undefined>(undefined);
	const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
	const audioContextRef = useRef<AudioContext | undefined>(undefined);

	const [status, setStatus] = useState<Status>("idle");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
	const [audioInputDevicesRefreshKey, setAudioInputDevicesRefreshKey] = useState<number>(ZERO);
	const [currentStreamLabel, setCurrentStreamLabel] = useState<string | undefined>(undefined);

	/**
	 * Stop capture and perform cleanup.
	 *
	 * @param options.setStoppedStatus - If `false` the hook will not set the status to "stopped".
	 */
	async function stop(options?: { setStoppedStatus?: boolean }): Promise<void> {
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
			await closeAudioContextSafely(audioContext);
		}

		setErrorMessage(undefined);
		setCurrentStreamLabel(undefined);
		if (options?.setStoppedStatus !== false) {
			setStatus("stopped");
		}
	}

	/**
	 * Internal helper to start a stream and wire up analyser state.
	 *
	 * @param getStream - Function returning a `MediaStream` promise.
	 * @param streamLabel - Human-readable label for the current stream.
	 */
	async function startStream(
		getStream: () => Promise<MediaStream>,
		streamLabel: string,
	): Promise<MediaStream | undefined> {
		setErrorMessage(undefined);
		setCurrentStreamLabel(undefined);
		setStatus("requesting-mic");

		await stop({ setStoppedStatus: false });

		const stream = await getStream().catch(async (error: unknown) => {
			await stop({ setStoppedStatus: false });
			setErrorMessage(String(error));
			setStatus("error");
			return undefined;
		});
		if (stream === undefined) {
			return undefined;
		}

		if (stream.getAudioTracks().length === ZERO) {
			stopMediaStreamTracks(stream);
			await stop({ setStoppedStatus: false });
			setErrorMessage("No audio track received from stream");
			setStatus("error");
			return undefined;
		}

		mediaStreamRef.current = stream;
		setAudioInputDevicesRefreshKey((prevKey) => prevKey + ONE);

		const analyserResult = createTimeDomainAnalyser({
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
		analyserRef.current = analyserResult.analyser;
		timeDomainBytesRef.current = analyserResult.timeDomainBytes;

		setStatus("mic-ready");
		setCurrentStreamLabel(streamLabel);
		return stream;
	}

	/**
	 * Start microphone capture for an optional device id.
	 * @param deviceId - Optional device id or "default" to use the default device.
	 */
	function startMic(deviceId?: string): Promise<MediaStream | undefined> {
		return startStream(
			() => getMicStreamForDevice(deviceId),
			deviceId === undefined || deviceId === "default" ? "microphone" : `microphone (${deviceId})`,
		);
	}

	/** Start display (tab/screen) audio capture. */
	function startDisplayAudio(): Promise<MediaStream | undefined> {
		return startStream(() => getDisplayAudioStream(), "tab/screen audio");
	}

	useEffect(() => (): void => void stop(), []);

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
