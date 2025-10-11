import { createClient } from "@supabase/supabase-js";

import { type Env } from "@/api/env";

let cachedSupabaseClientToken: string | undefined;
let tokenExpiry: number | undefined;

// Cache for user-specific tokens
const userTokenCache = new Map<string, { token: string; expiry: number }>();

/**
 * Gets a Supabase server client with service key for admin operations
 */
function getSupabaseServerClient(
	url: string,
	serviceKey: string,
): ReturnType<typeof createClient> {
	return createClient(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Returns a valid JWT token for the shared visitor user to use in Supabase clients.
 * Will reuse cached token until it expires.
 * On first run, will ensure the visitor user has the `visitor_id` claim.
 */
export async function getSupabaseClientToken(env: Env): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	// Reuse cached token if still valid
	if (
		cachedSupabaseClientToken !== undefined &&
		tokenExpiry !== undefined &&
		now < tokenExpiry - 10
	) {
		return cachedSupabaseClientToken;
	}

	const client = getSupabaseServerClient(
		env.VITE_SUPABASE_URL,
		env.SUPABASE_SERVICE_KEY,
	);

	// --- Sign in the existing visitor user ---
	const response = await client.auth.signInWithPassword({
		email: env.SUPABASE_VISITOR_EMAIL,
		password: env.SUPABASE_VISITOR_PASSWORD,
	});

	let { data } = response;
	const { error } = response;

	if (error) {
		throw new Error(`Failed to sign in visitor (initial): ${error.message}`);
	}

	// eslint-disable-next-line sonarjs/different-types-comparison
	if (data.session === null || data.user === null) {
		throw new Error("Missing session or user on initial visitor sign-in.");
	}

	// --- Ensure the visitor user has the `visitor_id` claim in their metadata ---
	// This is a self-correcting mechanism. If the claim is missing, we add it.
	// The RLS policy for `user_public` relies on this claim.
	if (
		data.user.app_metadata?.visitor_id === undefined ||
		data.user.app_metadata?.visitor_id === null
	) {
		console.warn(
			"Visitor user missing `visitor_id` claim. Updating user metadata...",
		);
		const { error: updateError } = await client.auth.admin.updateUserById(
			data.user.id,
			{ app_metadata: { ...data.user.app_metadata, visitor_id: data.user.id } },
		);

		if (updateError) {
			throw new Error(
				`Failed to update visitor user metadata: ${updateError.message}`,
			);
		}

		// --- Sign in again to get a fresh token with the new claim ---
		const signInResponse = await client.auth.signInWithPassword({
			email: env.SUPABASE_VISITOR_EMAIL,
			password: env.SUPABASE_VISITOR_PASSWORD,
		});

		// eslint-disable-next-line sonarjs/different-types-comparison
		if (signInResponse.error || signInResponse.data.session === null) {
			throw new Error(
				`Failed to sign in visitor (after update): ${
					signInResponse.error?.message ?? "No session"
				}`,
			);
		}
		// Use the new, correct data for the rest of the function
		data = signInResponse.data;
		console.warn("Successfully updated visitor user and re-authenticated.");
	}

	// eslint-disable-next-line require-atomic-updates
	cachedSupabaseClientToken = data.session.access_token;

	// Ensure expires_at is a number and fallback if missing
	const expiresAtRaw = data.session.expires_at;
	if (typeof expiresAtRaw === "number") {
		// eslint-disable-next-line require-atomic-updates
		tokenExpiry = expiresAtRaw;
	} else if (typeof expiresAtRaw === "string") {
		// fallback 1h
		// eslint-disable-next-line require-atomic-updates
		tokenExpiry = parseInt(expiresAtRaw, 10) || now + 3600;
	} else {
		// fallback 1h
		// eslint-disable-next-line require-atomic-updates
		tokenExpiry = now + 3600;
	}

	return cachedSupabaseClientToken;
}

/**
 * Returns a valid JWT token for a specific user to use in Supabase clients.
 * Will reuse cached token until it expires.
 * Ensures the token has app_metadata.user.user_id structure for RLS policies.
 */
export async function getSupabaseUserToken(
	env: Env,
	email: string,
	password: string,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const cacheKey = email;

	// Check if we have a valid cached token for this user
	const cached = userTokenCache.get(cacheKey);
	if (cached !== undefined && now < cached.expiry - 10) {
		return cached.token;
	}

	const client = getSupabaseServerClient(
		env.VITE_SUPABASE_URL,
		env.SUPABASE_SERVICE_KEY,
	);

	// Sign in the user
	const response = await client.auth.signInWithPassword({
		email,
		password,
	});

	let { data } = response;
	const { error } = response;

	if (error) {
		throw new Error(`Failed to sign in user: ${error.message}`);
	}

	// eslint-disable-next-line sonarjs/different-types-comparison
	if (data.session === null || data.user === null) {
		throw new Error("Missing session or user on user sign-in.");
	}

	// Ensure the user has the correct app_metadata structure for RLS policies
	// The policies expect: app_metadata.user.user_id
	const expectedMetadata = {
		...data.user.app_metadata,
		user: { user_id: data.user.id },
	};

	// Check if we need to update the user's metadata
	const currentUserData = data.user.app_metadata?.user?.user_id as
		| string
		| undefined;
	if (currentUserData !== data.user.id) {
		const { error: updateError } = await client.auth.admin.updateUserById(
			data.user.id,
			{ app_metadata: expectedMetadata },
		);

		if (updateError) {
			throw new Error(`Failed to update user metadata: ${updateError.message}`);
		}

		// Sign in again to get a fresh token with the updated metadata
		const signInResponse = await client.auth.signInWithPassword({
			email,
			password,
		});

		// eslint-disable-next-line sonarjs/different-types-comparison
		if (signInResponse.error || signInResponse.data.session === null) {
			throw new Error(
				`Failed to sign in user (after update): ${
					signInResponse.error?.message ?? "No session"
				}`,
			);
		}
		data = signInResponse.data;
	}

	const accessToken = data.session.access_token;

	// Calculate expiry time
	const expiresAtRaw = data.session.expires_at;
	let expiry: number;
	if (typeof expiresAtRaw === "number") {
		expiry = expiresAtRaw;
	} else if (typeof expiresAtRaw === "string") {
		// fallback 1h
		expiry = parseInt(expiresAtRaw, 10) || now + 3600;
	} else {
		// fallback 1h
		expiry = now + 3600;
	}

	// Cache the token
	userTokenCache.set(cacheKey, { token: accessToken, expiry });

	return accessToken;
}
