import { type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Type definition for globalThis with our cache attached.
 */
type GlobalWithSupabaseCache = typeof globalThis & {
	[SUPABASE_CLIENTS_KEY]?: Map<string, SupabaseClient<Database>>;
};

/**
 * Symbol key for storing Supabase clients globally.
 * Using a Symbol ensures no conflicts with other global properties.
 */
const SUPABASE_CLIENTS_KEY = Symbol.for("__supabaseClients__");

/**
 * Global singleton storage for Supabase clients.
 * Using globalThis ensures persistence across React re-renders in development.
 */
export default function getGlobalClientCache(): Map<string, SupabaseClient<Database>> {
	const global = globalThis as GlobalWithSupabaseCache;

	const existing = global[SUPABASE_CLIENTS_KEY];
	if (existing) {
		return existing;
	}

	const newMap = new Map<string, SupabaseClient<Database>>();
	global[SUPABASE_CLIENTS_KEY] = newMap;
	return newMap;
}
