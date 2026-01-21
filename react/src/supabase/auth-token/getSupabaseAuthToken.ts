import { getEnvValue } from "@/react/utils/env";

import { isTokenResponse } from "../token/isTokenResponse";
import {
	cacheSupabaseClientToken,
	cacheUserToken,
	clearSupabaseClientToken as clearClientTokenCache,
	clearUserToken,
	getCachedSupabaseClientToken,
	getCachedUserToken,
	isUserSignedIn as isUserSignedInCache,
} from "../token/tokenCache";

// Time constants used locally
const MS_IN_SECOND = 1000;

/**
 * Gets a Supabase client token, checking memory cache first, then fetching from API if needed.
 * The Supabase client token is a real Supabase JWT that allows access to RLS-protected data.
 */
function getSupabaseClientToken(): Promise<string> {
	// First, try to get token from memory cache
	const cachedToken = getCachedSupabaseClientToken();
	if (cachedToken !== undefined) {
		return Promise.resolve(cachedToken);
	}

	// If no valid cached token, fetch from API
	return fetchSupabaseClientTokenFromAPI();
}

/**
 * Fetches a Supabase client token from the API server.
 * This is a real Supabase JWT for the shared visitor user.
 */
async function fetchSupabaseClientTokenFromAPI(): Promise<string> {
	const apiBaseUrl = getEnvValue("API_BASE_URL");

	try {
		const response = await fetch(`${apiBaseUrl}/api/auth/visitor`);

		if (!response.ok) {
			throw new Error(`Failed to fetch visitor token: ${response.status}`);
		}

		const jsonRaw: unknown = await response.json().catch(() => undefined);

		if (!isTokenResponse(jsonRaw)) {
			console.error("Invalid token response from visitor endpoint:", jsonRaw);
			throw new Error("Unable to authenticate as visitor");
		}

		const data = jsonRaw;

		// Cache the token in memory (more secure than cookies)
		const expiryTime = Date.now() + data.expires_in * MS_IN_SECOND;
		cacheSupabaseClientToken(data.access_token, expiryTime);

		return data.access_token;
	} catch (error) {
		console.error("Error fetching visitor token:", error);
		throw new Error("Unable to authenticate as visitor", { cause: error });
	}
}

/**
 * Clears the Supabase client token from memory (useful for testing or manual refresh)
 */
function clearSupabaseClientToken(): void {
	clearClientTokenCache();
}

// cacheUserToken now lives in tokenCache

/**
 * Authenticates a user and returns their Supabase JWT token
 */
async function signInUser(email: string, password: string): Promise<string> {
	const apiBaseUrl = getEnvValue("API_BASE_URL");

	try {
		const response = await fetch(`${apiBaseUrl}/api/auth/user`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			throw new Error(`Authentication failed: ${response.status}`);
		}

		const jsonRaw: unknown = await response.json().catch(() => undefined);

		if (!isTokenResponse(jsonRaw)) {
			console.error("Invalid token response from user auth endpoint:", jsonRaw);
			throw new Error("Unable to authenticate user");
		}

		const data = jsonRaw;

		// Cache the user token in memory
		const expiryTime = Date.now() + data.expires_in * MS_IN_SECOND;
		cacheUserToken(data.access_token, expiryTime);

		return data.access_token;
	} catch (error) {
		console.error("Error signing in user:", error);
		throw new Error("Unable to authenticate user", { cause: error });
	}
}

/**
 * Signs out the current user and clears all tokens
 */
function signOutUser(): void {
	// clear both user and visitor tokens from tokenCache
	clearUserToken();
	clearClientTokenCache();
}

/**
 * Checks if a user is currently signed in
 */
function isUserSignedIn(): boolean {
	return isUserSignedInCache();
}

// Supabase client token helpers are in tokenCache

/**
 * Returns a current auth token appropriate for creating a Supabase client.
 * - If a user token is present and valid, return that (string)
 * - Otherwise return a Supabase visitor client token (fetched/cached)
 */
function getSupabaseAuthToken(): Promise<string | undefined> {
	const userToken = getCachedUserToken();
	if (userToken !== undefined) {
		console.warn("[getSupabaseAuthToken] Using USER token");
		return Promise.resolve(userToken);
	}

	// Fall back to the visitor client token
	console.warn("[getSupabaseAuthToken] Using VISITOR token");
	return getSupabaseClientToken();
}

export {
	clearSupabaseClientToken,
	getSupabaseAuthToken,
	getSupabaseClientToken,
	isUserSignedIn,
	signInUser,
	signOutUser,
};
