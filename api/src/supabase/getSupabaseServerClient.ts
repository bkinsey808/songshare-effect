import { createClient } from "@supabase/supabase-js";

/**
 * Gets a Supabase server client with service key for admin operations
 */
export function getSupabaseServerClient(
	url: string,
	serviceKey: string,
): ReturnType<typeof createClient> {
	return createClient(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
