const HUE_MAX = 360;
const HASH_MULTIPLIER = 31;
const HASH_INIT = 0;
const LOOP_STEP = 1;

/**
 * Stable hash of a string to a hue in [0, 360). Gives each duplicate set a distinct, randomish tint.
 *
 * @returns Hue value in the range [0, 360)
 */
export default function hashToHue(str: string): number {
	let acc = HASH_INIT;
	for (let idx = 0; idx < str.length; idx += LOOP_STEP) {
		const code = str.codePointAt(idx) ?? HASH_INIT;
		acc = Math.trunc(Math.imul(HASH_MULTIPLIER, acc) + code);
	}
	return ((acc % HUE_MAX) + HUE_MAX) % HUE_MAX;
}
