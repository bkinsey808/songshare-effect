/**
 * @param value - value to check
 * @returns true if value is a non-null object
 */
export default function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
