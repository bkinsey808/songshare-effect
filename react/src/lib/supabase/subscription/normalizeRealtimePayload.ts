import isRecord from "@/shared/type-guards/isRecord";

/**
 * Normalize Supabase realtime payload to our expected shape.
 * Supabase realtime-js may pass either:
 * - Normalized: { eventType, new?, old? }
 * - Wrapped: { ids?, data: { type, record?, old_record? } }
 *
 * This returns the normalized form so handlers can assume eventType/new/old.
 *
 * @param payload - Raw payload from postgres_changes
 * @returns Normalized payload or original if already normalized / unrecognized
 */
export default function normalizeRealtimePayload(payload: unknown): unknown {
	if (!isRecord(payload)) {
		return payload;
	}
	const { eventType: existingType } = payload as { eventType?: string };
	if (typeof existingType === "string") {
		return payload;
	}
	const { data } = payload as { data?: unknown };
	if (!isRecord(data) || typeof data["type"] !== "string") {
		return payload;
	}
	return {
		eventType: data["type"],
		new: isRecord(data["record"]) ? data["record"] : undefined,
		old: isRecord(data["old_record"]) ? data["old_record"] : undefined,
		errors: data["errors"],
	};
}
