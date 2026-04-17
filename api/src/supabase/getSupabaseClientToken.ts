import { Effect } from "effect";

import { ServerError } from "@/api/api-errors";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import { getCachedClientToken, setCachedClientToken } from "@/api/supabase/tokenCache";
import { MS_PER_SECOND, ONE_HOUR_SECONDS, TOKEN_CACHE_SKEW_SECONDS } from "@/shared/constants/http";

import signSupabaseJwtWithLegacySecret from "./signSupabaseJwtWithLegacySecret";

// This module only needs the Supabase-related env keys. Use a narrow type
// so callers that don't have platform bindings (BUCKET/ENVIRONMENT) don't
// need to provide them.
type SupabaseClientEnv = Readonly<{
	VITE_SUPABASE_URL: string;
	SUPABASE_SERVICE_KEY: string;
	SUPABASE_VISITOR_EMAIL: string;
	SUPABASE_VISITOR_PASSWORD: string;
	SUPABASE_LEGACY_JWT_SECRET?: string;
}>;

export type ClientTokenResult = Readonly<{
	accessToken: string;
	realtimeToken?: string | undefined;
}>;

/**
 * Returns a valid JWT token for the shared visitor user to use in Supabase clients.
 * Will reuse cached token until it expires.
 * On first run, will ensure the visitor user has the `visitor_id` claim.
 *
 * GoTrue issues ES256 tokens (ECC P-256). PostgREST now also verifies ES256, so
 * the raw GoTrue token is returned as `accessToken` for HTTP requests.
 *
 * When `SUPABASE_LEGACY_JWT_SECRET` is set, an additional HS256-signed `realtimeToken`
 * is also returned for use with Supabase Realtime WebSocket connections, which still
 * verify using the legacy HS256 secret after ECC key rotation.
 *
 * @param env - Environment variables containing Supabase URL, service key, and
 *   the visitor account credentials used to obtain and refresh the token.
 * @returns - Effect resolving to an object with `accessToken` (ES256, for PostgREST) and optionally
 *   `realtimeToken` (HS256, for Realtime WebSocket).
 */
export default function getSupabaseClientToken(
	env: SupabaseClientEnv,
): Effect.Effect<ClientTokenResult, ServerError> {
	return Effect.gen(function* getSupabaseClientTokenGen() {
		const now = Math.floor(Date.now() / MS_PER_SECOND);

		// Reuse cached token if still valid
		const cached = getCachedClientToken();
		if (
			cached.token !== undefined &&
			cached.expiry !== undefined &&
			now < cached.expiry - TOKEN_CACHE_SKEW_SECONDS
		) {
			return {
				accessToken: cached.token,
				...(cached.realtimeToken === undefined ? {} : { realtimeToken: cached.realtimeToken }),
			};
		}

		const client = getSupabaseServerClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

		// --- Sign in the existing visitor user ---
		const response = yield* Effect.tryPromise({
			try: () =>
				client.auth.signInWithPassword({
					email: env.SUPABASE_VISITOR_EMAIL,
					password: env.SUPABASE_VISITOR_PASSWORD,
				}),
			catch: (err) =>
				new ServerError({
					message: `Failed to sign in visitor (initial): ${String(err)}`,
					cause: err,
				}),
		});

		let { data, error } = response;

		if (error) {
			yield* Effect.fail(
				new ServerError({
					message: `Failed to sign in visitor (initial): ${error.message}`,
				}),
			);
		}

		if (data.session === null || data.user === null) {
			yield* Effect.fail(
				new ServerError({
					message: "Missing session or user on initial visitor sign-in.",
				}),
			);
		}

		// After the null check above, both are guaranteed non-null.
		// We access data directly since TypeScript doesn't narrow across Effect.fail.
		// Using ?? operator allows TypeScript to understand the type narrowing.
		const user = data.user ?? (yield* Effect.fail(
			new ServerError({
				message: "user is unexpectedly null",
			}),
		));
		const session = data.session ?? (yield* Effect.fail(
			new ServerError({
				message: "session is unexpectedly null",
			}),
		));

		// --- Ensure the visitor user has the `visitor_id` claim in their metadata ---
		if (
			user.app_metadata?.visitor_id === undefined ||
			user.app_metadata?.visitor_id === null
		) {
			console.warn("Visitor user missing `visitor_id` claim. Updating user metadata...");
			// Merge existing app metadata into a fresh object in a type-safe way,
			// then add the `visitor_id` claim. Avoid using `Object.assign({}, ...)`
			// or object spread to satisfy lint rules and preserve typing.
			const newAppMetadata: Record<string, unknown> = {};
			const existingMetadata = user.app_metadata;
			if (typeof existingMetadata === "object" && existingMetadata !== null) {
				const asRecord = existingMetadata as Record<string, unknown>;
				for (const key of Object.keys(asRecord)) {
					newAppMetadata[key] = asRecord[key];
				}
			}
			newAppMetadata.visitor_id = user.id;

			const updateResult = yield* Effect.tryPromise({
				try: () =>
					client.auth.admin.updateUserById(user.id, {
						app_metadata: newAppMetadata,
					}),
				catch: (err) =>
					new ServerError({
						message: `Failed to update visitor user metadata: ${String(err)}`,
						cause: err,
					}),
			});

			const { error: updateError } = updateResult;

			if (updateError) {
				yield* Effect.fail(
					new ServerError({
						message: `Failed to update visitor user metadata: ${updateError.message}`,
					}),
				);
			}

			// --- Sign in again to get a fresh token with the new claim ---
			const signInResponse = yield* Effect.tryPromise({
				try: () =>
					client.auth.signInWithPassword({
						email: env.SUPABASE_VISITOR_EMAIL,
						password: env.SUPABASE_VISITOR_PASSWORD,
					}),
				catch: (err) =>
					new ServerError({
						message: `Failed to sign in visitor (after update): ${String(err)}`,
						cause: err,
					}),
			});

			if (signInResponse.error || signInResponse.data.session === null) {
				yield* Effect.fail(
					new ServerError({
						message: `Failed to sign in visitor (after update): ${signInResponse.error?.message ?? "No session"}`,
					}),
				);
			}

			// Use the new session and user from the sign-in response
			const { data: newSignInData } = signInResponse;
			data.user = newSignInData.user;
			data.session = newSignInData.session;
			console.warn("Successfully updated visitor user and re-authenticated.");
		}

		// Ensure expires_at is a number and fallback if missing
		const expiresAtRaw = session.expires_at;
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

		// GoTrue issues ES256 tokens; PostgREST now also verifies ES256. Return the
		// raw token directly — no HS256 re-signing needed for PostgREST.
		const accessToken = session.access_token;

		// When the legacy HS256 secret is configured, also produce an HS256-signed token
		// for Realtime WebSocket auth. Supabase Realtime still uses the legacy secret for
		// JWT verification after GoTrue rotated to ES256.
		let realtimeToken: string | undefined = undefined;
		const legacySecret = env.SUPABASE_LEGACY_JWT_SECRET;
		if (legacySecret !== undefined && legacySecret !== "") {
			const jwtPayload: Record<string, unknown> = {
				iss: `${env.VITE_SUPABASE_URL}/auth/v1`,
				sub: user.id,
				aud: "authenticated",
				role: "authenticated",
				iat: now,
				exp: expiry,
				app_metadata: user.app_metadata,
			};
			realtimeToken = yield* Effect.tryPromise({
				try: () => signSupabaseJwtWithLegacySecret(jwtPayload, legacySecret),
				catch: (err) =>
					new ServerError({
						message: `Failed to sign JWT with legacy secret: ${String(err)}`,
						cause: err,
					}),
			});
		}

		setCachedClientToken(accessToken, expiry, realtimeToken);

		return {
			accessToken,
			...(realtimeToken === undefined ? {} : { realtimeToken }),
		};
	});
}
