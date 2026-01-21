import { getCachedUserToken } from "../token/tokenCache";
import getSupabaseClientToken from "./getSupabaseClientToken";

/**
 * Returns a current auth token appropriate for creating a Supabase client.
 * - If a user token is present and valid, return that
 * - Otherwise return a Supabase visitor client token (fetched/cached)
 */
export default function getSupabaseAuthToken(): Promise<string | undefined> {
	const userToken = getCachedUserToken();
	if (userToken !== undefined) {
		console.warn("[getSupabaseAuthToken] Using USER token");
		return Promise.resolve(userToken);
	}

	// Fall back to the visitor client token
	console.warn("[getSupabaseAuthToken] Using VISITOR token");
	return getSupabaseClientToken();
}
