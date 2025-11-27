// Lightweight in-memory cache for Supabase tokens used by server-side code.

// Cached shared visitor token
let cachedSupabaseClientToken: string | undefined = undefined;
let tokenExpiry: number | undefined = undefined;

// Cache for user-specific tokens
export const userTokenCache: Map<string, { token: string; expiry: number }> =
	new Map<string, { token: string; expiry: number }>();

export function getCachedClientToken(): {
	token: string | undefined;
	expiry: number | undefined;
} {
	return { token: cachedSupabaseClientToken, expiry: tokenExpiry };
}

export function setCachedClientToken(token: string, expiry: number): void {
	cachedSupabaseClientToken = token;
	tokenExpiry = expiry;
}

export function clearCachedClientToken(): void {
	cachedSupabaseClientToken = undefined;
	tokenExpiry = undefined;
}
