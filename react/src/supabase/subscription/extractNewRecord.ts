import type { RealtimePayload } from "./types";

/**
 * Safely extracts the `new` field from a realtime payload for INSERT/UPDATE events.
 *
 * @param payload - Realtime payload
 * @returns The new record if present, otherwise undefined
 */
export default function extractNewRecord<TRecord>(
	payload: RealtimePayload<TRecord>,
): TRecord | undefined {
	return payload.new;
}
