import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import { getCachedClientToken, setCachedClientToken } from "@/api/supabase/tokenCache";
import { MS_PER_SECOND, ONE_HOUR_SECONDS, TOKEN_CACHE_SKEW_SECONDS } from "@/shared/constants/http";

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
export default async function getSupabaseClientToken(env: SupabaseClientEnv): Promise<string> {
	const now = Math.floor(Date.now() / MS_PER_SECOND);

	// Reuse cached token if still valid
	const cached = getCachedClientToken();
	if (
		cached.token !== undefined &&
		cached.expiry !== undefined &&
		now < cached.expiry - TOKEN_CACHE_SKEW_SECONDS
	) {
		return cached.token;
	}

	const client = getSupabaseServerClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

	// --- Sign in the existing visitor user ---
	const response = await client.auth.signInWithPassword({
		email: env.SUPABASE_VISITOR_EMAIL,
		password: env.SUPABASE_VISITOR_PASSWORD,
	});

	let { data, error } = response;

	if (error) {
		throw new Error(`Failed to sign in visitor (initial): ${error.message}`);
	}

	if (data.session === null || data.user === null) {
		throw new Error("Missing session or user on initial visitor sign-in.");
	}

	// --- Ensure the visitor user has the `visitor_id` claim in their metadata ---
	if (
		data.user.app_metadata?.visitor_id === undefined ||
		data.user.app_metadata?.visitor_id === null
	) {
		console.warn("Visitor user missing `visitor_id` claim. Updating user metadata...");
		// Merge existing app metadata into a fresh object in a type-safe way,
		// then add the `visitor_id` claim. Avoid using `Object.assign({}, ...)`
		// or object spread to satisfy lint rules and preserve typing.
		const newAppMetadata: Record<string, unknown> = {};
		const existingMetadata = data.user.app_metadata;
		if (typeof existingMetadata === "object" && existingMetadata !== null) {
			const asRecord = existingMetadata as Record<string, unknown>;
			for (const key of Object.keys(asRecord)) {
				newAppMetadata[key] = asRecord[key];
			}
		}
		newAppMetadata.visitor_id = data.user.id;

		const { error: updateError } = await client.auth.admin.updateUserById(data.user.id, {
			app_metadata: newAppMetadata,
		});

		if (updateError) {
			throw new Error(`Failed to update visitor user metadata: ${updateError.message}`);
		}

		// --- Sign in again to get a fresh token with the new claim ---
		const signInResponse = await client.auth.signInWithPassword({
			email: env.SUPABASE_VISITOR_EMAIL,
			password: env.SUPABASE_VISITOR_PASSWORD,
		});

		if (signInResponse.error || signInResponse.data.session === null) {
			throw new Error(
				`Failed to sign in visitor (after update): ${signInResponse.error?.message ?? "No session"}`,
			);
		}
		// Use the new, correct data for the rest of the function (via destructuring)
		const { data: newData } = signInResponse;
		data = newData;
		console.warn("Successfully updated visitor user and re-authenticated.");
	}

	const accessToken = data.session.access_token;

	// Ensure expires_at is a number and fallback if missing
	const expiresAtRaw = data.session.expires_at;
	// Initialize with a conservative fallback to satisfy `init-declarations`.
	let expiry: number = now + ONE_HOUR_SECONDS;
	if (typeof expiresAtRaw === "number") {
		expiry = expiresAtRaw;
	} else if (typeof expiresAtRaw === "string") {
		// fallback 1h
		expiry = Number.parseInt(expiresAtRaw, 10) || now + ONE_HOUR_SECONDS;
	} else {
		// fallback 1h
		expiry = now + ONE_HOUR_SECONDS;
	}

	setCachedClientToken(accessToken, expiry);

	return accessToken;
}
