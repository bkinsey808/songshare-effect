/**
 * Runtime type guard for plain records (non-null objects).
 *
 * @param value - Value to check
 * @returns `true` when `value` is an object and not `null`
 */
export default function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
