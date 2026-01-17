import clamp01 from "./clamp01";

/**
 * Exponential smoothing step.
 *
 * Computes `previous + (next - previous) * alpha` with `alpha` clamped to [0, 1].
 */
export default function smoothValue(previous: number, next: number, alpha: number): number {
	const alphaClamped = clamp01(alpha);
	return previous + (next - previous) * alphaClamped;
}
