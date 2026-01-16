const ZERO = 0;
const ONE = 1;

/**
 * Clamps a number to the inclusive range [0, 1].
 *
 * Treats NaN as 0.
 */
export function clamp01(value: number): number {
	if (Number.isNaN(value)) {
		return ZERO;
	}
	if (value < ZERO) {
		return ZERO;
	}
	if (value > ONE) {
		return ONE;
	}
	return value;
}

/**
 * Exponential smoothing step.
 *
 * Computes `previous + (next - previous) * alpha` with `alpha` clamped to [0, 1].
 */
export function smoothValue(previous: number, next: number, alpha: number): number {
	const alphaClamped = clamp01(alpha);
	return previous + (next - previous) * alphaClamped;
}
