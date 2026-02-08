import { getCachedSupabaseClientToken } from "../token/tokenCache";
import fetchSupabaseClientTokenFromApi from "./fetchSupabaseClientTokenFromApi";

/**
 * Get a Supabase "visitor" client token.
 *
 * Checks the in-memory cache and returns a cached token if one is available and
 * still valid. If there is no cached token, this function will fetch a fresh
 * token from the API via {@link fetchSupabaseClientTokenFromApi}.
 *
 * @returns A Supabase JWT string suitable for initializing a Supabase client.
 * @throws When unable to obtain a token from the cache or the API.
 */
export default function getSupabaseClientToken(): Promise<string> {
	// First, try to get token from memory cache
	const cachedToken = getCachedSupabaseClientToken();
	if (cachedToken !== undefined) {
		return Promise.resolve(cachedToken);
	}

	// If no valid cached token, fetch from API
	return fetchSupabaseClientTokenFromApi();
}
