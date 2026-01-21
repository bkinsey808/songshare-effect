/**
 * Safely extracts a string message from an unknown error value.
 *
 * This helper centralizes runtime narrowing for caught errors so callers
 * don't accidentally assign `unknown` or `any`-typed values to strongly
 * typed variables (for example, React state that expects `string`).
 *
 * @param error - The caught error (unknown)
 * @param fallback - Fallback string returned when a message cannot be extracted
 * @returns A safe string message describing the error
 */
export default function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
	if (error instanceof Error && typeof error.message === "string") {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	try {
		// Defensive: convert anything else to string (e.g., numbers, objects)
		return String(error);
	} catch {
		return fallback;
	}
}
