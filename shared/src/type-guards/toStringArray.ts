/**
 * Converts a possibly-readonly array (or unknown) into a mutable string array.
 * Ensures runtime safety by checking Array.isArray and coercing items to strings.
 *
 * @param value - Value to convert
 * @returns A mutable string array, or an empty array if value is not an array
 */
export default function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map(String);
}
