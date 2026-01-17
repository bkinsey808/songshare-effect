const ZERO = 0;
const ONE = 1;

/**
 * Clamps a number to the inclusive range [0, 1].
 *
 * Treats NaN as 0.
 */
export default function clamp01(value: number): number {
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
