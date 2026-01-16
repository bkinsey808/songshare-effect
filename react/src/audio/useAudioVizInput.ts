import { useCallback, useState } from "react";

import useAudioCapture from "@/react/audio/useAudioCapture";
import useSmoothedAudioLevelRef from "@/react/audio/useSmoothedAudioLevelRef";

const ZERO = 0;

type Options = {
	uiIntervalMs: number;
	smoothingAlpha: number;
};

/**
 * Small focused hook that manages audio capture and a smoothed audio level helper.
 *
 * Responsibilities:
 * - Manage selected audio input device id
 * - Start/stop microphone / display-audio capture
 * - Provide a `SmoothedAudioLevel` instance and a ref for use by render loops
 * - Surface common values: `levelUiValue`, `audioInputDevicesRefreshKey`, `status`, `errorMessage`, `currentStreamLabel`
 */
export default function useAudioVizInput(options: Options): {
	/** Smoothed audio level helpers */
	startLevelUiTimer: () => void;
	stopLevelUiTimer: () => void;
	readSmoothedLevelNow: () => number;
	readBytesAndSmoothedLevelNow: () => { bytes: Uint8Array<ArrayBuffer>; level: number } | undefined;
	resetLevel: () => void;
	/** Current UI-friendly level (cached on interval) */
	levelUiValue: number | undefined;
	/** Start microphone capture for the currently-selected device */
	startMic: () => Promise<MediaStream | undefined>;
	/** Start display/tab audio capture */
	startDeviceAudio: () => Promise<MediaStream | undefined>;
	/** Stop capture (optionally control whether to set stopped status) */
	stop: (options?: { setStoppedStatus?: boolean }) => Promise<void>;
	selectedAudioInputDeviceId: string;
	setSelectedAudioInputDeviceId: (id: string) => void;
	audioInputDevicesRefreshKey: number;
	status: string;
	errorMessage: string | undefined;
	currentStreamLabel: string | undefined;
} {
	const audioCapture = useAudioCapture();
	const { analyserRef, timeDomainBytesRef } = audioCapture;

	const { audioLevel, audioLevelRef } = useSmoothedAudioLevelRef(
		{ analyserRef, timeDomainBytesRef },
		options,
	);

	const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceIdInternal] =
		useState<string>("default");
	const setSelectedAudioInputDeviceId = useCallback((id: string): void => {
		setSelectedAudioInputDeviceIdInternal(id);
	}, []);

	const startLevelUiTimer = useCallback((): void => {
		audioLevelRef.current?.startUiTimer();
	}, [audioLevelRef]);

	const stopLevelUiTimer = useCallback((): void => {
		audioLevelRef.current?.stopUiTimer();
	}, [audioLevelRef]);

	const readSmoothedLevelNow = useCallback(
		(): number => audioLevelRef.current?.readSmoothedLevelNow() ?? ZERO,
		[audioLevelRef],
	);

	const readBytesAndSmoothedLevelNow = useCallback(
		() => audioLevelRef.current?.readBytesAndSmoothedLevelNow(),
		[audioLevelRef],
	);

	const resetLevel = useCallback((): void => {
		audioLevelRef.current?.reset();
	}, [audioLevelRef]);

	const startMic = useCallback(async (): Promise<MediaStream | undefined> => {
		const stream = await audioCapture.startMic(selectedAudioInputDeviceId);
		if (!stream) {
			return undefined;
		}
		startLevelUiTimer();
		readSmoothedLevelNow();
		return stream;
	}, [audioCapture, readSmoothedLevelNow, selectedAudioInputDeviceId, startLevelUiTimer]);

	const startDeviceAudio = useCallback(async (): Promise<MediaStream | undefined> => {
		const stream = await audioCapture.startDisplayAudio();
		if (!stream) {
			return undefined;
		}
		startLevelUiTimer();
		readSmoothedLevelNow();
		return stream;
	}, [audioCapture, readSmoothedLevelNow, startLevelUiTimer]);

	const stop = useCallback(
		async (options?: { setStoppedStatus?: boolean }) => {
			resetLevel();
			if (options?.setStoppedStatus === undefined) {
				await audioCapture.stop();
			} else {
				await audioCapture.stop({ setStoppedStatus: options.setStoppedStatus });
			}
		},
		[audioCapture, resetLevel],
	);

	return {
		startLevelUiTimer,
		stopLevelUiTimer,
		readSmoothedLevelNow,
		readBytesAndSmoothedLevelNow,
		resetLevel,
		levelUiValue: audioLevel.levelUiValue,
		startMic,
		startDeviceAudio,
		stop,
		selectedAudioInputDeviceId,
		setSelectedAudioInputDeviceId,
		audioInputDevicesRefreshKey: audioCapture.audioInputDevicesRefreshKey,
		status: audioCapture.status,
		errorMessage: audioCapture.errorMessage,
		currentStreamLabel: audioCapture.currentStreamLabel,
	};
}
