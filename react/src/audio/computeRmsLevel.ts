import { clamp01 } from "@/react/typegpu/numeric";

const BYTE_MIDPOINT = 128;
const BYTE_SCALE = 128;

/**
 * Compute the RMS (root mean square) level from time-domain audio bytes.
 *
 * @param bytes - Byte samples (typically from an AnalyserNode.getByteTimeDomainData()).
 * @returns A value in the range [0, 1] representing the RMS amplitude.
 */
export default function computeRmsLevelFromTimeDomainBytes(bytes: Uint8Array): number {
	let sumSquares = 0;
	for (const sample of bytes) {
		const centered = sample - BYTE_MIDPOINT;
		const normalized = centered / BYTE_SCALE;
		sumSquares += normalized * normalized;
	}
	const meanSquares = sumSquares / bytes.length;
	const rms = Math.sqrt(meanSquares);
	return clamp01(rms);
}
