// Lightweight in-memory cache for Supabase tokens used by server-side code.

// Cached shared visitor token
let cachedSupabaseClientToken: string | undefined = undefined;
let tokenExpiry: number | undefined = undefined;

/**
 * Cache for user-specific tokens keyed by user email. Each entry contains the
 * `token` string and its numeric `expiry` time (epoch seconds).
 */
export const userTokenCache: Map<string, { token: string; expiry: number }> = new Map<
	string,
	{ token: string; expiry: number }
>();

/**
 * Return the cached shared visitor client token and its expiry time.
 *
 * @returns - An object containing `token` (the access token) and `expiry`
 *   (epoch seconds) when set; both fields may be `undefined` when no token is
 *   cached.
 */
export function getCachedClientToken(): {
	token: string | undefined;
	expiry: number | undefined;
} {
	return { token: cachedSupabaseClientToken, expiry: tokenExpiry };
}

/**
 * Cache the shared visitor client token with the given expiry time.
 *
 * @param token - The Supabase access token to cache.
 * @param expiry - Expiry time in epoch seconds for when the token becomes
 *   invalid.
 * @returns - nothing.
 */
export function setCachedClientToken(token: string, expiry: number): void {
	cachedSupabaseClientToken = token;
	tokenExpiry = expiry;
}

/**
 * Clear the cached shared visitor client token.
 *
 * @returns - nothing.
 */
export function clearCachedClientToken(): void {
	cachedSupabaseClientToken = undefined;
	tokenExpiry = undefined;
}
