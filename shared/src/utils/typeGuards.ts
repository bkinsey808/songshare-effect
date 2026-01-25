export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function isString(value: unknown): value is string {
	return typeof value === "string";
}

export function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Validates that a value is a string, returning it as-is or a default empty string.
 *
 * @param value - Value to validate
 * @param defaultValue - Default value to return if not a string (defaults to "")
 * @returns The string value or the default value
 */
export function guardAsString(value: unknown, defaultValue = ""): string {
	return typeof value === "string" ? value : defaultValue;
}

/**
 * Convert a possibly-readonly array (or unknown) into a mutable string array.
 * Ensures runtime safety by checking Array.isArray and coercing items to strings.
 *
 * @param value - Value to convert
 * @returns A mutable string array, or an empty array if value is not an array
 */
export function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map(String);
}
