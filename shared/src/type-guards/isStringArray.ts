/**
 * Runtime type guard for arrays of strings.
 *
 * @param value - Value to check
 * @returns `true` when `value` is an array and every item is a string
 */
export default function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}
