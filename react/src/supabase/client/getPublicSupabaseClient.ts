import { type SupabaseClient, createClient } from "@supabase/supabase-js";

import { getEnvValueSafe } from "@/react/utils/env";
import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Creates a basic Supabase client with anonymous access only.
 * This uses the ANON_KEY and provides no authenticat@on.
 * Only useful for completely public data that doesn't require RLS.
 */
export default function getPublicSupabaseClient(): SupabaseClient<Database> | undefined {
	const supabaseUrl = getEnvValueSafe("SUPABASE_URL");
	const supabaseKey = getEnvValueSafe("SUPABASE_ANON_KEY");

	if (supabaseUrl === undefined || supabaseKey === undefined) {
		return undefined;
	}

	const client = createClient(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	}) as SupabaseClient<Database>;

	return client;
}
