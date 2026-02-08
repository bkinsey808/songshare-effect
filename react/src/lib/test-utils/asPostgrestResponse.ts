import type { PostgrestResponse } from "@/react/lib/supabase/client/SupabaseClientLike";

/**
 * Test helper to safely cast a value to PostgrestResponse.
 *
 * Localizing the ESLint disable here keeps test files clean.
 */
export default function asPostgrestResponse(value: unknown): PostgrestResponse {
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast */
	return value as PostgrestResponse;
}
