/**
 * Runtime type guard that checks whether a value is a string.
 *
 * @param value - Value to check
 * @returns `true` when `value` is a string
 */
export default function isString(value: unknown): value is string {
	return typeof value === "string";
}
