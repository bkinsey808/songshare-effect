import isRecord from "@/shared/type-guards/isRecord";

import type { RealtimeChannelLike } from "../SupabaseClientLike";

/**
 * Type predicate that checks if a value has an 'on' method matching RealtimeChannelLike.
 * @param value - The value to check
 * @returns True if value has an 'on' function property
 */
function hasOn(value: unknown): value is { on: RealtimeChannelLike["on"] } {
	if (!isRecord(value)) {
		return false;
	}

	return typeof value["on"] === "function";
}

/**
 * Type predicate that checks if a value has a 'subscribe' method matching RealtimeChannelLike.
 * @param value - The value to check
 * @returns True if value has a 'subscribe' function property
 */
function hasSubscribe(value: unknown): value is { subscribe: RealtimeChannelLike["subscribe"] } {
	if (!isRecord(value)) {
		return false;
	}

	return typeof value["subscribe"] === "function";
}

/**
 * Type guard that narrows an unknown value to RealtimeChannelLike.
 * Verifies the value has the expected shape with on/subscribe methods.
 * Returns the value if valid, undefined otherwise.
 * @param value - The value to check
 * @returns The value as RealtimeChannelLike if valid, undefined otherwise
 */
export default function guardAsRealtimeChannelLike(
	value: unknown,
): RealtimeChannelLike | undefined {
	if (!hasOn(value) || !hasSubscribe(value)) {
		return undefined;
	}
	return value;
}
