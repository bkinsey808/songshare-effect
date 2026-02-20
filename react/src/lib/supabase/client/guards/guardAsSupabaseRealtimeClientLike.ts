import isRecord from "@/shared/type-guards/isRecord";

import type { SupabaseRealtimeClientLike } from "../SupabaseClientLike";

/**
 * Runtime guard: returns true if value appears to have realtime capabilities.
 */
function hasRealtime(value: unknown): value is SupabaseRealtimeClientLike {
	return (
		isRecord(value) &&
		typeof value["channel"] === "function" &&
		typeof value["removeChannel"] === "function"
	);
}

/**
 * Type guard that validates and narrows any value to SupabaseRealtimeClientLike.
 * This allows treating both real SupabaseClient and test mocks uniformly for realtime features.
 *
 * @param value - The value to check (typically a SupabaseClient or mock)
 * @returns The value as SupabaseRealtimeClientLike if valid, undefined otherwise
 */
export default function guardAsSupabaseRealtimeClientLike(
	value: unknown,
): SupabaseRealtimeClientLike | undefined {
	if (!hasRealtime(value)) {
		return undefined;
	}
	return value;
}
