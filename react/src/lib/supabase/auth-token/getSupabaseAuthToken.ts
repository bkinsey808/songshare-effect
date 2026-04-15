import { getCachedUserToken } from "../token/token-cache";
import fetchSupabaseUserTokenFromApi from "./fetchSupabaseUserTokenFromApi";
import getSupabaseClientToken from "./getSupabaseClientToken";

/**
 * Returns a current auth token appropriate for creating a Supabase client.
 *
 * Resolution order:
 * - Return a cached user token if available
 * - Attempt to fetch a user token from the API if rehydration likely occurred
 * - Fall back to a cached visitor client token
 *
 * @returns A user or client auth token string, or `undefined` when none available
 */
export default async function getSupabaseAuthToken(): Promise<string | undefined> {
	// 1. Try to get cached user token first
	const userToken = getCachedUserToken();
	if (userToken !== undefined) {
		return userToken;
	}

	// 2. Try to fetch/wait for user token from API (deduplicated)
	const fetchedUserToken = await fetchSupabaseUserTokenFromApi();
	if (fetchedUserToken !== undefined) {
		return fetchedUserToken;
	}

	// 3. Fall back to the visitor client token
	return getSupabaseClientToken();
}
