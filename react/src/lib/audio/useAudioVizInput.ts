import { useCallback, useEffect, useRef, useState } from "react";

import useSmoothedAudioLevelRef from "@/react/lib/audio/smooth/useSmoothedAudioLevelRef";
import useAudioCapture from "@/react/lib/audio/useAudioCapture";
import { ZERO } from "@/shared/constants/shared-constants";

import type { MinimalMediaStream } from "./audio-types";

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
 * - Surface common values: `levelUiValue`, `audioInputDevicesRefreshKey`, `status`, `errorMessage`, `currentStreamLabel` *
 * @returns Object containing helpers and current audio capture state */
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
	startMic: () => Promise<MinimalMediaStream | undefined>;
	/** Start display/tab audio capture */
	startDeviceAudio: () => Promise<MinimalMediaStream | undefined>;
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

	const startMic = useCallback(async (): Promise<MinimalMediaStream | undefined> => {
		const stream = await audioCapture.startMic(selectedAudioInputDeviceId);
		if (!stream) {
			return undefined;
		}
		startLevelUiTimer();
		readSmoothedLevelNow();
		return stream;
	}, [audioCapture, selectedAudioInputDeviceId, startLevelUiTimer, readSmoothedLevelNow]);

	const startDeviceAudio = useCallback(async (): Promise<MinimalMediaStream | undefined> => {
		const stream = await audioCapture.startDisplayAudio();
		if (!stream) {
			return undefined;
		}
		startLevelUiTimer();
		readSmoothedLevelNow();
		return stream;
	}, [audioCapture, startLevelUiTimer, readSmoothedLevelNow]);

	// Capture stop in a ref to keep it stable regardless of audioCapture object changes
	const captureStopRef = useRef(audioCapture.stop);
	// Keep the latest stop function in a ref so callbacks can call it safely
	useEffect(() => {
		captureStopRef.current = audioCapture.stop;
	}, [audioCapture.stop]);

	const stop = useCallback(
		async (options?: { setStoppedStatus?: boolean }) => {
			resetLevel();
			if (options) {
				await captureStopRef.current(options);
			} else {
				await captureStopRef.current();
			}
		},
		[resetLevel],
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
