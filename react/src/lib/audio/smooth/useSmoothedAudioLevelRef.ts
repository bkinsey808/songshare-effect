import { useEffect, useRef } from "react";

import useSmoothedAudioLevel, {
	type AudioAnalyser,
	type SmoothedAudioLevel,
} from "@/react/lib/audio/smooth/useSmoothedAudioLevel";

type AudioLevelRefs = {
	analyserRef: { current: AudioAnalyser | undefined };
	timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
};

type AudioLevelOptions = {
	uiIntervalMs: number;
	smoothingAlpha: number;
};

/**
 * Convenience hook that returns a `SmoothedAudioLevel` instance and a ref kept in sync with it.
 *
 * This mirrors the common pattern of creating a smoothed audio level and also keeping a
 * `RefObject` that points to the current instance so it can be safely accessed from
 * non-reactic callbacks (render loops, external libs, etc.).
 *
 * @param refs - Refs to the analyser and time-domain buffer (same shape as `useSmoothedAudioLevel`).
 * @param options - Options passed to `useSmoothedAudioLevel`.
 * @returns Object with `audioLevel` and a `RefObject` kept in sync
 */
export default function useSmoothedAudioLevelRef(
	refs: AudioLevelRefs,
	options: AudioLevelOptions,
): {
	audioLevel: SmoothedAudioLevel;
	audioLevelRef: React.RefObject<SmoothedAudioLevel | undefined>;
} {
	const audioLevel: SmoothedAudioLevel = useSmoothedAudioLevel(refs, options);
	const audioLevelRef = useRef<SmoothedAudioLevel | undefined>(audioLevel);

	useEffect(() => {
		audioLevelRef.current = audioLevel;
	}, [audioLevel]);

	return { audioLevel, audioLevelRef };
}
