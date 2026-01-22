/**
 * Runtime guard: returns true if value appears to have `auth.getUser` like Supabase client.
 */
export default function hasAuth(
	value: unknown,
): value is { auth: { getUser: () => Promise<unknown> } } {
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
