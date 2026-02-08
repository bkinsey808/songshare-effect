import { vi } from "vitest";

import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";

/**
 * Helper to mock the Supabase client return value.
 * used to mock getSupabaseClient()
 */
export default function mockGetSupabaseClient(): void {
	vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
}
