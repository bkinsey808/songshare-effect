import { getSupabaseServerClient } from "@/api/supabase/getSupabaseServerClient";
import {
	getCachedClientToken,
	setCachedClientToken,
} from "@/api/supabase/tokenCache";

// This module only needs the Supabase-related env keys. Use a narrow type
// so callers that don't have platform bindings (BUCKET/ENVIRONMENT) don't
// need to provide them.
type SupabaseClientEnv = Readonly<{
	VITE_SUPABASE_URL: string;
	SUPABASE_SERVICE_KEY: string;
	SUPABASE_VISITOR_EMAIL: string;
	SUPABASE_VISITOR_PASSWORD: string;
}>;

/**
 * Returns a valid JWT token for the shared visitor user to use in Supabase clients.
 * Will reuse cached token until it expires.
 * On first run, will ensure the visitor user has the `visitor_id` claim.
 */
export async function getSupabaseClientToken(
	env: SupabaseClientEnv,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	// Reuse cached token if still valid
	const cached = getCachedClientToken();
	if (
		cached.token !== undefined &&
		cached.expiry !== undefined &&
		now < cached.expiry - 10
	) {
		return cached.token;
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
				`Failed to sign in visitor (after update): ${signInResponse.error?.message ?? "No session"}`,
			);
		}
		// Use the new, correct data for the rest of the function
		data = signInResponse.data;
		console.warn("Successfully updated visitor user and re-authenticated.");
	}

	const accessToken = data.session.access_token;

	// Ensure expires_at is a number and fallback if missing
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

	setCachedClientToken(accessToken, expiry);

	return accessToken;
}
