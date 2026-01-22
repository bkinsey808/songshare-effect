import type { SupabaseClientLike } from "../SupabaseClientLike";

/**
 * Runtime guard: returns true if value appears to have a `from` method like Supabase client.
 */
export default function hasFrom<DB = unknown>(value: unknown): value is SupabaseClientLike<DB> {
	if (value === null || value === undefined) {
		return false;
	}
	const obj = value as { from?: unknown };
	return typeof obj.from === "function";
}
