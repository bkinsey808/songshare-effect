import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Gets a Supabase server client with service key for admin operations
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
