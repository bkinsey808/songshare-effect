import { type Env } from "@/api/env";
import { getSupabaseServerClient } from "@/api/supabase/getSupabaseServerClient";
import { userTokenCache } from "@/api/supabase/tokenCache";

/**
 * Returns a valid JWT token for a specific user to use in Supabase clients.
 * Will reuse cached token until it expires.
 * Ensures the token has app_metadata.user.user_id structure for RLS policies.
 */
export async function getSupabaseUserToken({
	env,
	email,
	password,
}: Readonly<{
	env: Env;
	email: string;
	password: string;
}>): Promise<string> {
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
				`Failed to sign in user (after update): ${signInResponse.error?.message ?? "No session"}`,
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
