import { isRecord, isString } from "@/shared/utils/typeGuards";

import { type RealtimePayload } from "./types";

/**
 * Type guard to validate a standard Supabase realtime payload structure.
 *
 * @param value - Value to check
 * @returns true if value has the expected realtime payload shape
 */
export default function isRealtimePayload(value: unknown): value is RealtimePayload<unknown> {
	if (!isRecord(value)) {
		return false;
	}
	const { eventType } = value;
	return isString(eventType) && ["INSERT", "UPDATE", "DELETE"].includes(eventType);
}
