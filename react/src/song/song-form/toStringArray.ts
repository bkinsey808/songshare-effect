// Helper functions for song form
// Small helpers are colocated with the form to avoid barrel imports.

/**
 * Convert a possibly-readonly array (or unknown) into a mutable string array.
 * Ensures runtime safety by checking Array.isArray and coercing items to strings.
 */
export default function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map(String);
}
