import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Validate that a required environment configuration value is present.
 *
 * The helper is intended for early failure when a required runtime value
 * (for example the Supabase URL or service key) is missing. It throws a
 * clear error message including the environment variable name to aid
 * debugging in server environments.
 *
 * @param value - The configuration value to validate
 * @param envVarName - The environment variable name used for the value
 * @returns The original value when non-empty
 * @throws Error when `value` is an empty string
 */
function requireNonEmptyConfigValue(value: string, envVarName: string): string {
	if (value !== "") {
		return value;
	}

	throw new Error(`Missing required Supabase config: ${envVarName}`);
}

/**
 * Create and return a Supabase server client configured for server-side/admin use.
 *
 * @param url - The Supabase project URL (for example, `VITE_SUPABASE_URL`). Must be non-empty.
 * @param serviceKey - The Supabase service key used for privileged admin operations. Must be non-empty.
 * @returns - A Supabase client instance typed to the project's `Database`.
 * @throws Error when the required Supabase URL or service key is missing from the active runtime env.
 */
export default function getSupabaseServerClient(
	url: string,
	serviceKey: string,
): SupabaseClient<Database> {
	return createClient<Database>(
		requireNonEmptyConfigValue(url, "VITE_SUPABASE_URL"),
		requireNonEmptyConfigValue(serviceKey, "SUPABASE_SERVICE_KEY"),
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	);
}
