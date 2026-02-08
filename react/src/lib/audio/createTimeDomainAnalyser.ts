import type {
	MinimalAnalyserNode,
	MinimalMediaStream,
	MinimalMediaStreamAudioSourceNode,
} from "./audio-types";

import getAudioContextCtor from "./getAudioContextCtor";

/**
 * Create a Web Audio `AnalyserNode` configured for time-domain sampling.
 *
 * The function creates a new `AudioContext`, connects the provided `MediaStream`
 * as a source, and configures an `AnalyserNode` with the requested fftSize and
 * smoothingTimeConstant. On success it returns the context, analyser, and a
 * reusable `Uint8Array` buffer sized to the analyser's FFT size. On failure it
 * returns an object containing an `errorMessage`.
 *
 * @param args.stream - The `MediaStream` to analyse.
 * @param args.fftSize - The analyser FFT size.
 * @param args.smoothingTimeConstant - The analyser smoothing constant.
 * @returns Either the instantiated `audioContext`, `analyser`, and `timeDomainBytes`, or an `{ errorMessage }` object.
 */
export default async function createTimeDomainAnalyser(args: {
	stream: MinimalMediaStream;
	fftSize: number;
	smoothingTimeConstant: number;
}): Promise<
	| {
			audioContext: Pick<AudioContext, "close" | "resume">;
			source: MinimalMediaStreamAudioSourceNode;
			analyser: MinimalAnalyserNode;
			timeDomainBytes: Uint8Array<ArrayBuffer>;
	  }
	| { errorMessage: string }
> {
	const { stream, fftSize, smoothingTimeConstant } = args;

	const AudioContextCtor = getAudioContextCtor();
	if (AudioContextCtor === undefined) {
		return { errorMessage: "This browser does not support AudioContext" };
	}

	const audioContext = new AudioContextCtor();

	// Type guard to satisfy createMediaStreamSource which requires a full MediaStream.
	// In practice, our MinimalMediaStream is always a real MediaStream at runtime.
	if (!(typeof MediaStream !== "undefined" && stream instanceof MediaStream)) {
		return { errorMessage: "Invalid MediaStream provided" };
	}

	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = fftSize;
	analyser.smoothingTimeConstant = smoothingTimeConstant;
	source.connect(analyser);

	// Some browsers require the analyser to be connected to a destination to
	// stay active. We connect to a GainNode with 0 gain so no audio is actually heard.
	const silentGain = audioContext.createGain();
	silentGain.gain.value = 0;
	analyser.connect(silentGain);
	silentGain.connect(audioContext.destination);

	if (audioContext.state === "suspended") {
		await audioContext.resume().catch((error: unknown) => {
			console.error("[AudioCapture] Failed to resume AudioContext:", error);
		});
	}

	return {
		audioContext,
		source,
		analyser,
		timeDomainBytes: new Uint8Array(new ArrayBuffer(analyser.fftSize)),
	};
}
