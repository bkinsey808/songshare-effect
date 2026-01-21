import { type SupabaseClient, createClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/generated/supabaseTypes";

import { getEnvValueSafe } from "@/react/utils/env";

import getGlobalClientCache from "./getGlobalClientCache";

const MS_IN_SECOND = 1000;

// Local time constants (only used by this module)
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;

/**
 * Returns a Supabase client authenticated with a Supabase client token.
 * The supabaseClientToken can be from either:
 * - A shared visitor user (for anonymous access)
 * - A specific authenticated user (after sign-in)
 */
export default function getSupabaseClient(
	supabaseClientToken?: string,
): SupabaseClient<Database> | undefined {
	const supabaseUrl = getEnvValueSafe("SUPABASE_URL");
	const supabaseKey = getEnvValueSafe("SUPABASE_ANON_KEY");

	if (
		supabaseUrl === undefined ||
		supabaseKey === undefined ||
		supabaseClientToken === undefined ||
		supabaseClientToken === ""
	) {
		return undefined;
	}

	// Get global cache (survives React re-renders)
	const clients = getGlobalClientCache();

	// Return cached client if exists
	if (clients.has(supabaseClientToken)) {
		return clients.get(supabaseClientToken);
	}
	const client = createClient(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
		global: {
			headers: {
				Authorization: `Bearer ${supabaseClientToken}`,
			},
		},
	}) as SupabaseClient<Database>;

	// Set the auth token for real-time WebSocket connections after client creation
	// This must be done after client creation to ensure proper binding
	void client.realtime.setAuth(supabaseClientToken);

	// Cache client for this token
	// supabaseClientToken is defined here (checked above)
	clients.set(supabaseClientToken, client);

	// Remove the cached client after token expiration (1 hour)
	setTimeout(
		() => clients.delete(supabaseClientToken),
		MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MS_IN_SECOND,
	);

	return client;
}
