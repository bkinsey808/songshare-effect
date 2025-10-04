import { getEnvValue } from "../utils/env";

type TokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
};

// In-memory token storage (more secure than client-accessible cookies)
let cachedSupabaseClientToken: string | undefined;
let tokenExpirationTime: number | undefined;

// Separate cache for user tokens
let cachedUserToken: string | undefined;
let userTokenExpirationTime: number | undefined;

/**
 * Stores the Supabase client token in memory with expiration time
 */
function cacheSupabaseClientToken(token: string, expiryTime: number): void {
	cachedSupabaseClientToken = token;
	tokenExpirationTime = expiryTime;
}

/**
 * Gets the Supabase client token from memory if it exists and hasn't expired
 */
function getCachedSupabaseClientToken(): string | undefined {
	if (
		cachedSupabaseClientToken === undefined ||
		tokenExpirationTime === undefined
	) {
		return undefined;
	}

	const now = Date.now();

	// If token has expired or will expire in the next 5 minutes, return undefined
	if (now >= tokenExpirationTime - 5 * 60 * 1000) {
		cachedSupabaseClientToken = undefined;
		tokenExpirationTime = undefined;
		return undefined;
	}

	return cachedSupabaseClientToken;
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

		const data = (await response.json()) as TokenResponse;

		// Cache the token in memory (more secure than cookies)
		const expiryTime = Date.now() + data.expires_in * 1000;
		cacheSupabaseClientToken(data.access_token, expiryTime);

		return data.access_token;
	} catch (error) {
		console.error("Error fetching visitor token:", error);
		throw new Error("Unable to authenticate as visitor");
	}
}

/**
 * Gets a Supabase client token, checking memory cache first, then fetching from API if needed.
 * The Supabase client token is a real Supabase JWT that allows access to RLS-protected data.
 */
export async function getSupabaseClientToken(): Promise<string> {
	// First, try to get token from memory cache
	const cachedToken = getCachedSupabaseClientToken();
	if (cachedToken !== undefined) {
		return cachedToken;
	}

	// If no valid cached token, fetch from API
	return await fetchSupabaseClientTokenFromAPI();
}

/**
 * Clears the Supabase client token from memory (useful for testing or manual refresh)
 */
export function clearSupabaseClientToken(): void {
	cachedSupabaseClientToken = undefined;
	tokenExpirationTime = undefined;
}

/**
 * Stores the user token in memory with expiration time
 */
function cacheUserToken(token: string, expiryTime: number): void {
	cachedUserToken = token;
	userTokenExpirationTime = expiryTime;

	// Clear visitor token when user signs in
	clearSupabaseClientToken();
}

/**
 * Gets the user token from memory if it exists and hasn't expired
 */
function getCachedUserToken(): string | undefined {
	if (cachedUserToken === undefined || userTokenExpirationTime === undefined) {
		return undefined;
	}

	const now = Date.now();

	// If token has expired or will expire in the next 5 minutes, return undefined
	if (now >= userTokenExpirationTime - 5 * 60 * 1000) {
		cachedUserToken = undefined;
		userTokenExpirationTime = undefined;
		return undefined;
	}

	return cachedUserToken;
}

/**
 * Authenticates a user and returns their Supabase JWT token
 */
export async function signInUser(
	email: string,
	password: string,
): Promise<string> {
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

		const data = (await response.json()) as TokenResponse;

		// Cache the user token in memory
		const expiryTime = Date.now() + data.expires_in * 1000;
		cacheUserToken(data.access_token, expiryTime);

		return data.access_token;
	} catch (error) {
		console.error("Error signing in user:", error);
		throw new Error("Unable to authenticate user");
	}
}

/**
 * Gets the current authentication token - user token if signed in, otherwise visitor token
 */
export async function getSupabaseAuthToken(): Promise<string> {
	// First, try to get user token if signed in
	const userToken = getCachedUserToken();
	if (userToken !== undefined) {
		return userToken;
	}

	// Fall back to visitor token
	return await getSupabaseClientToken();
}

/**
 * Signs out the current user and clears all tokens
 */
export function signOutUser(): void {
	cachedUserToken = undefined;
	userTokenExpirationTime = undefined;
	clearSupabaseClientToken();
}

/**
 * Checks if a user is currently signed in
 */
export function isUserSignedIn(): boolean {
	return getCachedUserToken() !== undefined;
}
