import { ONE, ZERO } from "@/shared/constants/shared-constants";

/**
 * Clamps a number to the inclusive range [0, 1].
 *
 * Treats NaN as 0.
 *
 * @returns The clamped value in [0, 1]
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
