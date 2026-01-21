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

export function cacheUserToken(token: string, expiryTime: number): void {
	cachedUserToken = token;
	userTokenExpirationTime = expiryTime;

	// Clear cached visitor token when user signs in
	clearSupabaseClientToken();
}

export function clearUserToken(): void {
	cachedUserToken = undefined;
	userTokenExpirationTime = undefined;
}

export function clearSupabaseClientToken(): void {
	cachedSupabaseClientToken = undefined;
	tokenExpirationTime = undefined;
}

export function cacheSupabaseClientToken(token: string, expiryTime: number): void {
	cachedSupabaseClientToken = token;
	tokenExpirationTime = expiryTime;
}

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

export function isUserSignedIn(): boolean {
	return getCachedUserToken() !== undefined;
}

// tokenCache has no dependency on the token response shape — that belongs in the
// validator module to avoid circular imports.
