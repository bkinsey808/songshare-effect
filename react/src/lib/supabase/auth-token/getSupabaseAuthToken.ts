import { getCachedUserToken } from "../token/token-cache";
import fetchSupabaseUserTokenFromApi from "./fetchSupabaseUserTokenFromApi";
import getSupabaseClientToken from "./getSupabaseClientToken";

/**
 * Returns a current auth token appropriate for creating a Supabase client.
 * - If a user token is present and valid, return that
 * - If we are likely signed in but token is missing (rehydration), try to fetch it
 * - Otherwise return a Supabase visitor client token (fetched/cached)
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
