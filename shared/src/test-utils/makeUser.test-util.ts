import type { User } from "../generated/supabaseSchemas";
import { TEST_USER_ID } from "./testUserConstants";
const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00Z";

/**
 * Build a complete `user` row for tests from a small override object.
 *
 * @param overrides - Partial field overrides for the default user row
 * @returns A complete `user` row
 */
export default function makeUser(overrides: Partial<User> = {}): User {
	const base: User = {
		user_id: TEST_USER_ID,
		chord_display_mode: "roman",
		email: "u@example.com",
		google_calendar_access: "none",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "free",
		role_expires_at: undefined,
		slide_number_preference: "hide",
		slide_orientation_preference: "system",
		sub: undefined,
		created_at: DEFAULT_TIMESTAMP,
		updated_at: DEFAULT_TIMESTAMP,
	};

	return {
		...base,
		...overrides,
	};
}
