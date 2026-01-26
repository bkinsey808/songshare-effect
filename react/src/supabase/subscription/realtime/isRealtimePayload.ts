import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import { type RealtimePayload } from "../subscription-types";

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
