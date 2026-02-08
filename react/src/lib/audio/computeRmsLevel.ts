import clamp01 from "@/react/lib/audio/clamp01";

const BYTE_MIDPOINT = 128;
const BYTE_SCALE = 128;

/**
 * Compute the RMS (root-mean-square) level from an 8-bit time-domain buffer.
 *
 * Behavior / normalization:
 * - Input is expected to be the output of an Audio `Uint8Array` analyser (0..255).
 * - Samples are centered at `128` and scaled by `128` so that `128 -> 0`.
 *   (e.g. 192 -> 0.5, 0 -> -1, 255 -> ~0.992)
 * - RMS is the square root of the mean of squared normalized samples.
 * - The result is clamped to the inclusive range [0, 1].
 *
 * Edge-cases & stability:
 * - An empty buffer yields `NaN` during computation but is treated as `0` by
 *   `clamp01` (avoids divide-by-zero errors and matches test expectations).
 *
 * Complexity: O(n) time, O(1) extra space.
 *
 * @param bytes - time-domain samples (Uint8Array from an AnalyserNode)
 * @returns RMS level in [0, 1]
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
