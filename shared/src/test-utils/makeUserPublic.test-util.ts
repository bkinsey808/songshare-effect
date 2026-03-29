import type { UserPublic } from "../generated/supabaseSchemas";
import { TEST_USER_ID, TEST_USERNAME } from "./testUserConstants";

/**
 * Build a complete `user_public` row for tests from a small override object.
 *
 * @param overrides - Partial field overrides for the default user_public row
 * @returns A complete `user_public` row
 */
export default function makeUserPublic(overrides: Partial<UserPublic> = {}): UserPublic {
	return {
		user_id: TEST_USER_ID,
		username: TEST_USERNAME,
		...overrides,
	};
}
