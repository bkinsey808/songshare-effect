// Small runtime guard: narrow unknown to plain Record<string, unknown>
export default function isRecordStringUnknown(
	value: unknown,
): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
