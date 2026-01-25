/**
 * Generates a unique ID for slides and other form elements
 * Uses crypto.randomUUID when available, falls back to Math.random
 */
const ZERO = 0;
const UUID_SLICE_END = 11;
const RANDOM_SLICE_START = 2;
const RANDOM_SLICE_END = 11;
const RANDOM_RADIX = 36;

export default function generateId(): string {
	// Use crypto.randomUUID if available, fallback to Math.random for dev
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID().slice(ZERO, UUID_SLICE_END);
	}
	return Math.random().toString(RANDOM_RADIX).slice(RANDOM_SLICE_START, RANDOM_SLICE_END);
}
