export default function isRecord(value: unknown): value is Record<string, unknown> {
	// Treat plain objects as records. Exclude null and arrays.
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
