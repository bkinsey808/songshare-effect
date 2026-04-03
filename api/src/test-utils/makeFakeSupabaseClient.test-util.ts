import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/shared/test-utils/forceCast.test-util";

/**
 * Return a dummy value matching `createClient`'s return type for tests.
 *
 * @returns A minimal fake Supabase client.
 */
export default function makeFakeSupabaseClient(): ReturnType<typeof createClient> {
	return forceCast<ReturnType<typeof createClient>>({});
}
