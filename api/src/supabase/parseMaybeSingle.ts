/**
 * Small runtime helper to safely extract `.data`, `.error`, and `.status`
 * from a Supabase `maybeSingle()` response. This centralizes the single
 * narrow castsite and avoids repeating `as unknown as` throughout the code.
 */
export function parseMaybeSingle(res: unknown): {
	data?: unknown;
	error?: unknown;
	status?: number;
} {
	if (res === undefined || res === null) return {};
	if (typeof res !== "object") return {};
	// Narrow using a typed Record so eslint is happier about member access.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any
	const record = res as Record<string, any>;
	const out: { data?: unknown; error?: unknown; status?: number } = {};
	if (Object.prototype.hasOwnProperty.call(record, "data"))
		out.data = record["data"];
	if (Object.prototype.hasOwnProperty.call(record, "error"))
		out.error = record["error"];
	if (
		Object.prototype.hasOwnProperty.call(record, "status") &&
		typeof record["status"] === "number"
	)
		out.status = record["status"];
	return out;
}
