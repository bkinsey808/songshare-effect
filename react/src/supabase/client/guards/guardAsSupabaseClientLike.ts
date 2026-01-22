import type { SupabaseClientLike } from "../SupabaseClientLike";

import hasAuth from "./hasAuth";
import hasFrom from "./hasFrom";

/**
 * Type guard that validates and narrows any Supabase-like value to SupabaseClientLike.
 * This allows treating both real SupabaseClient and test mocks uniformly.
 *
 * @param value - The value to check (typically a SupabaseClient or mock)
 * @returns The value as SupabaseClientLike if it has the required shape, undefined otherwise
 */
export default function guardAsSupabaseClientLike<DB = unknown>(
	value: unknown,
): SupabaseClientLike<DB> | undefined {
	if (!hasFrom(value) || !hasAuth(value)) {
		return undefined;
	}
	return value;
}
