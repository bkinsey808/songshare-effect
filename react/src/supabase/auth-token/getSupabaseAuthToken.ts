import { getCachedUserToken } from "../token/tokenCache";
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
	console.warn("[getSupabaseAuthToken] checking cache...");
	const userToken = getCachedUserToken();
	if (userToken !== undefined) {
		console.warn("[getSupabaseAuthToken] Using cached USER token");
		return userToken;
	}

	// 2. Try to fetch/wait for user token from API (deduplicated)
	console.warn("[getSupabaseAuthToken] checking API...");
	const fetchedUserToken = await fetchSupabaseUserTokenFromApi();
	if (fetchedUserToken !== undefined) {
		console.warn("[getSupabaseAuthToken] Using fetched USER token");
		return fetchedUserToken;
	}

	// 3. Fall back to the visitor client token
	console.warn("[getSupabaseAuthToken] Falling back to VISITOR token");
	return getSupabaseClientToken();
}
