import { TEST_USER_ID } from "./testUserConstants";

type SupabaseAppMetadata = {
	user?: {
		user_id?: string;
	};
	userPublic?: Record<string, unknown>;
	visitor_id?: string;
};

/**
 * Build a Supabase app_metadata payload for tests.
 *
 * @param overrides - Partial app_metadata overrides
 * @returns App metadata with a default nested user_id claim
 */
export default function makeSupabaseAppMetadata(
	overrides: Partial<SupabaseAppMetadata> = {},
): SupabaseAppMetadata {
	return {
		user: {
			user_id: TEST_USER_ID,
		},
		...overrides,
	};
}
