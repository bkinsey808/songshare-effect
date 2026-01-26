/**
 * Validates that a value is a string, returning it unchanged or a default.
 *
 * @param value - Value to validate
 * @param defaultValue - Default value to return if not a string (defaults to "")
 * @returns The string value or the default value
 */
export default function guardAsString(value: unknown, defaultValue = ""): string {
	return typeof value === "string" ? value : defaultValue;
}
