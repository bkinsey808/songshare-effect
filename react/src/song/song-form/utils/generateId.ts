/**
 * Generates a unique ID for slides and other form elements
 * Uses crypto.randomUUID when available, falls back to Math.random
 */
export function generateId(): string {
	// Use crypto.randomUUID if available, fallback to Math.random for dev
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID().slice(0, 11);
	}
	return Math.random().toString(36).slice(2, 11);
}
