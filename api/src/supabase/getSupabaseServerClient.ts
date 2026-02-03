import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Create and return a Supabase server client configured for server-side/admin use.
 *
 * @param url - The Supabase project URL (for example, `VITE_SUPABASE_URL`).
 * @param serviceKey - The Supabase service key used for privileged admin operations.
 * @returns - A Supabase client instance typed to the project's `Database`.
 */
export default function getSupabaseServerClient(
	url: string,
	serviceKey: string,
): SupabaseClient<Database> {
	return createClient<Database>(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
