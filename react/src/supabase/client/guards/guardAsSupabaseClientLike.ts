import type { SupabaseClientLike } from "../SupabaseClientLike";

/**
 * Runtime guard: returns true if value appears to have `auth.getUser` like Supabase client.
 */
function hasAuth(value: unknown): value is { auth: { getUser: () => Promise<unknown> } } {
	if (value === null || value === undefined) {
		return false;
	}
	const obj = value as { auth?: unknown };
	if (typeof obj.auth !== "object" || obj.auth === null) {
		return false;
	}
	const auth = obj.auth as { getUser?: unknown };
	return typeof auth.getUser === "function";
}

/**
 * Runtime guard: returns true if value appears to have a `from` method like Supabase client.
 */
function hasFrom<DB = unknown>(value: unknown): value is SupabaseClientLike<DB> {
	if (value === null || value === undefined) {
		return false;
	}
	const obj = value as { from?: unknown };
	return typeof obj.from === "function";
}

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
