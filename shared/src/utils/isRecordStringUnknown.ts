// Small runtime guard: narrow unknown to plain Record<string, unknown>

/**
 * Runtime guard that narrows `unknown` to `Record<string, unknown>` (plain object).
 *
 * @param value - Value to test
 * @returns True when `value` is a non-null object
 */
export default function isRecordStringUnknown(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
