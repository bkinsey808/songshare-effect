import { getSupabaseServerClient } from "@/api/supabase/getSupabaseServerClient";
import { userTokenCache } from "@/api/supabase/tokenCache";
import {
	MS_PER_SECOND,
	ONE_HOUR_SECONDS,
	TOKEN_CACHE_SKEW_SECONDS,
} from "@/shared/constants/http";

// Narrow env shape for functions that only need Supabase credentials.
type SupabaseClientEnv = Readonly<{
	VITE_SUPABASE_URL: string;
	SUPABASE_SERVICE_KEY: string;
	SUPABASE_VISITOR_EMAIL: string;
	SUPABASE_VISITOR_PASSWORD: string;
}>;

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
	env: SupabaseClientEnv;
	email: string;
	password: string;
}>): Promise<string> {
	const now = Math.floor(Date.now() / MS_PER_SECOND);
	const cacheKey = email;

	// Check if we have a valid cached token for this user
	const cached = userTokenCache.get(cacheKey);
	if (cached !== undefined && now < cached.expiry - TOKEN_CACHE_SKEW_SECONDS) {
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

	let { data, error } = response;

	if (error) {
		throw new Error(`Failed to sign in user: ${error.message}`);
	}

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
	function getUserIdFromAppMetadata(meta: unknown): string | undefined {
		if (typeof meta !== "object" || meta === null) {
			return undefined;
		}
		// Narrow to a record for runtime checks. Localized disables keep this
		// check safe and contained to this helper.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
		const rec = meta as Record<string, unknown>;
		const { user } = rec;
		if (typeof user !== "object" || user === null) {
			return undefined;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
		const { user_id: uid } = user as Record<string, unknown>;
		return typeof uid === "string" ? uid : undefined;
	}

	const currentUserData = getUserIdFromAppMetadata(data.user.app_metadata);
	if (currentUserData !== data.user.id) {
		const { error: updateError } = await client.auth.admin.updateUserById(
			data.user.id,
			{
				app_metadata: expectedMetadata,
			},
		);

		if (updateError) {
			throw new Error(`Failed to update user metadata: ${updateError.message}`);
		}

		// Sign in again to get a fresh token with the updated metadata
		const signInResponse = await client.auth.signInWithPassword({
			email,
			password,
		});

		if (signInResponse.error || signInResponse.data.session === null) {
			throw new Error(
				`Failed to sign in user (after update): ${signInResponse.error?.message ?? "No session"}`,
			);
		}
		const { data: newData } = signInResponse;
		data = newData;
	}

	const accessToken = data.session.access_token;

	// Calculate expiry time
	const expiresAtRaw = data.session.expires_at;
	// Initialize with a conservative fallback to satisfy `init-declarations`.
	let expiry: number = now + ONE_HOUR_SECONDS;
	if (typeof expiresAtRaw === "number") {
		expiry = expiresAtRaw;
	} else if (typeof expiresAtRaw === "string") {
		// fallback 1h
		expiry = parseInt(expiresAtRaw, 10) || now + ONE_HOUR_SECONDS;
	} else {
		// fallback 1h
		expiry = now + ONE_HOUR_SECONDS;
	}

	// Cache the token
	userTokenCache.set(cacheKey, { token: accessToken, expiry });

	return accessToken;
}
