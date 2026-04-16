// Lightweight in-memory cache for Supabase tokens used by server-side code.

// Cached shared visitor token
let cachedSupabaseClientToken: string | undefined = undefined;
let tokenExpiry: number | undefined = undefined;
let cachedRealtimeToken: string | undefined = undefined;

/**
 * Cached user-token entry keyed by a caller-chosen identity string.
 */
export type UserTokenCacheEntry = Readonly<{
	token: string;
	expiry: number;
	realtimeToken?: string | undefined;
}>;

/**
 * Cache for user-specific tokens keyed by a stable identity string such as
 * email or `user_id`.
 */
export const userTokenCache: Map<string, UserTokenCacheEntry> = new Map<
	string,
	UserTokenCacheEntry
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
	realtimeToken: string | undefined;
} {
	return {
		token: cachedSupabaseClientToken,
		expiry: tokenExpiry,
		realtimeToken: cachedRealtimeToken,
	};
}

/**
 * Cache the shared visitor client token with the given expiry time.
 *
 * @param token - The Supabase access token to cache.
 * @param expiry - Expiry time in epoch seconds for when the token becomes
 *   invalid.
 * @param realtimeToken - Optional realtime token associated with the client
 * @returns - nothing.
 */
export function setCachedClientToken(token: string, expiry: number, realtimeToken?: string): void {
	cachedSupabaseClientToken = token;
	tokenExpiry = expiry;
	cachedRealtimeToken = realtimeToken;
}

/**
 * Clear the cached shared visitor client token.
 *
 * @returns - nothing.
 */
export function clearCachedClientToken(): void {
	cachedSupabaseClientToken = undefined;
	tokenExpiry = undefined;
	cachedRealtimeToken = undefined;
}
