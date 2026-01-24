import type { RealtimePayload } from "../subscription-types";

/**
 * Safely extracts the `old` field from a realtime payload for DELETE events.
 *
 * @param payload - Realtime payload
 * @returns The old record if present, otherwise undefined
 */
export default function extractOldRecord<TRecord>(
	payload: RealtimePayload<TRecord>,
): TRecord | undefined {
	return payload.old;
}
