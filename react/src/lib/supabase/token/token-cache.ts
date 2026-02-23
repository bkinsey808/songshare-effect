/**
 * In-memory Supabase token cache
 *
 * This module provides a lightweight in-memory cache for Supabase tokens
 * (visitor/client tokens and user tokens). Tokens are cached with an expiry
 * timestamp and helper functions expose safe accessors that respect a short
 * expiry buffer to avoid using tokens that are about to expire.
 *
 * Note: This cache is intentionally in-memory (not persisted to localStorage)
 * to reduce risk of token leakage and to keep token lifecycle management
 * centralized for the client-side helpers.
 */
// In-memory token storage (more secure than client-accessible cookies)
let cachedSupabaseClientToken: string | undefined = undefined;
let tokenExpirationTime: number | undefined = undefined;

// Separate cache for user tokens
let cachedUserToken: string | undefined = undefined;
let userTokenExpirationTime: number | undefined = undefined;

// Time constants
const TOKEN_EXPIRY_BUFFER_MINUTES = 5;
const SECONDS_IN_MINUTE = 60;
const MS_IN_SECOND = 1000;

/**
 * Returns the cached user token if present and not expired (with buffer window).
 *
 * @returns The cached user token string, or `undefined` when no valid token is available.
 */
export function getCachedUserToken(): string | undefined {
	if (cachedUserToken === undefined || userTokenExpirationTime === undefined) {
		return undefined;
	}

	const now = Date.now();

	// If token has expired or will expire within the buffer window, return undefined
	if (
		now >=
		userTokenExpirationTime - TOKEN_EXPIRY_BUFFER_MINUTES * SECONDS_IN_MINUTE * MS_IN_SECOND
	) {
		cachedUserToken = undefined;
		userTokenExpirationTime = undefined;
		return undefined;
	}

	return cachedUserToken;
}

/**
 * Cache the provided user token and expiry time (milliseconds since epoch).
 * Also clears any cached visitor token since user tokens take precedence.
 *
 * @param token - The user auth token to cache.
 * @param expiryTime - Expiry time as milliseconds since epoch.
 * @returns void
 */
export function cacheUserToken(token: string, expiryTime: number): void {
	cachedUserToken = token;
	userTokenExpirationTime = expiryTime;

	// Clear cached visitor token when user signs in
	clearSupabaseClientToken();
}

/**
 * Clears the cached user token and its expiry time.
 *
 * @returns void
 */
export function clearUserToken(): void {
	cachedUserToken = undefined;
	userTokenExpirationTime = undefined;
}

/**
 * Clears the cached visitor/client token and its expiry time.
 *
 * @returns void
 */
export function clearSupabaseClientToken(): void {
	cachedSupabaseClientToken = undefined;
	tokenExpirationTime = undefined;
}

/**
 * Cache a visitor/client token and its expiry time (milliseconds since epoch).
 *
 * @param token - The visitor/client token to cache.
 * @param expiryTime - Expiry time as milliseconds since epoch.
 * @returns void
 */
export function cacheSupabaseClientToken(token: string, expiryTime: number): void {
	cachedSupabaseClientToken = token;
	tokenExpirationTime = expiryTime;
}

/**
 * Returns the cached client token if present and not expired (with buffer window).
 *
 * @returns The cached client token string, or `undefined` when no valid token is available.
 */
export function getCachedSupabaseClientToken(): string | undefined {
	if (cachedSupabaseClientToken === undefined || tokenExpirationTime === undefined) {
		return undefined;
	}

	const now = Date.now();

	// If token has expired or will expire within the buffer window, return undefined
	if (now >= tokenExpirationTime - TOKEN_EXPIRY_BUFFER_MINUTES * SECONDS_IN_MINUTE * MS_IN_SECOND) {
		cachedSupabaseClientToken = undefined;
		tokenExpirationTime = undefined;
		return undefined;
	}

	return cachedSupabaseClientToken;
}

/**
 * Convenience helper that returns true when a valid user token is cached.
 *
 * @returns True when a valid user token is cached, otherwise false.
 */
export function isUserSignedIn(): boolean {
	return getCachedUserToken() !== undefined;
}

// tokenCache has no dependency on the token response shape — that belongs in the
// validator module to avoid circular imports.
