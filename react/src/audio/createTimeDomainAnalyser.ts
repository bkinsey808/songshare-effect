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
export default function createTimeDomainAnalyser(args: {
	stream: MediaStream;
	fftSize: number;
	smoothingTimeConstant: number;
}):
	| {
			audioContext: AudioContext;
			analyser: AnalyserNode;
			timeDomainBytes: Uint8Array<ArrayBuffer>;
	  }
	| { errorMessage: string } {
	const { stream, fftSize, smoothingTimeConstant } = args;

	const AudioContextCtor = getAudioContextCtor();
	if (AudioContextCtor === undefined) {
		return { errorMessage: "This browser does not support AudioContext" };
	}

	const audioContext = new AudioContextCtor();
	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = fftSize;
	analyser.smoothingTimeConstant = smoothingTimeConstant;
	source.connect(analyser);

	return {
		audioContext,
		analyser,
		timeDomainBytes: new Uint8Array(new ArrayBuffer(analyser.fftSize)),
	};
}
