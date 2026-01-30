/**
 * Create a realistic `user_public` record for tests containing an owner username.
 *
 * @param attrs - Partial attributes to override the record defaults.
 * @returns A plain object representing a `user_public` row (contains username).
 */
export default function makeUserPublic(
	attrs: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
	return {
		user_id: "00000000-0000-0000-0000-000000000002",
		username: "owner_user",
		...attrs,
	};
}
