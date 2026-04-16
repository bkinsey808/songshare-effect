import { Effect } from "effect";

import { log as serverLog } from "@/api/logger";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import signSupabaseJwtWithLegacySecret from "@/api/supabase/signSupabaseJwtWithLegacySecret";
import { userTokenCache } from "@/api/supabase/tokenCache";
import { MS_PER_SECOND, ONE_HOUR_SECONDS, TOKEN_CACHE_SKEW_SECONDS } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import { DatabaseError } from "../api-errors";
import type { ReadonlyContext } from "../hono/ReadonlyContext.type";
import getVerifiedUserSession from "./getVerifiedSession";

type TokenResponse = Readonly<{
	access_token: string;
	token_type: string;
	expires_in: number;
	realtime_token?: string | undefined;
}>;
const NO_EXPIRY_SECONDS = 0;

/**
 * Type guard that checks whether a value is a plain record (object).
 *
 * @param value - Value to test
 * @returns True when the value is a non-null object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Verifies that the Supabase `app_metadata` object matches the provided user id and username.
 *
 * @param appMetadata - Metadata to inspect
 * @param userId - Expected user id
 * @param username - Expected username
 * @returns True when metadata contains matching `user` and `userPublic` fields
 */
function metadataMatchesUser(
	appMetadata: unknown,
	userId: string,
	username: string,
): appMetadata is Record<string, unknown> {
	if (!isRecord(appMetadata)) {
		return false;
	}

	const userValue = appMetadata["user"];
	const userPublicValue = appMetadata["userPublic"];
	if (!isRecord(userValue) || !isRecord(userPublicValue)) {
		return false;
	}

	return (
		userValue["user_id"] === userId &&
		userPublicValue["user_id"] === userId &&
		userPublicValue["username"] === username
	);
}

/**
 * Get a Supabase-compatible JWT token for the currently authenticated user.
 *
 * Uses the shared Supabase visitor user account but updates the visitor
 * account's `app_metadata` to include the current application's
 * `user.user_id` so Row Level Security (RLS) policies can authorize
 * user-specific access.
 *
 * This follows the same pattern as `getSupabaseClientToken` but adds user
 * metadata instead of a `visitor_id` claim.
 *
 * @param ctx - The readonly Hono `Context` containing environment bindings and request information.
 * @returns An Effect that yields a `TokenResponse` ({ access_token, token_type, expires_in })
 *          or fails with a `DatabaseError` when authentication or Supabase operations fail.
 */
export default function getUserToken(
	ctx: ReadonlyContext,
): Effect.Effect<TokenResponse, DatabaseError> {
	return Effect.gen(function* getUserTokenGen($) {
		// Verify the user session first
		const userSessionData = yield* $(getVerifiedUserSession(ctx));
		const userId = userSessionData.user.user_id;
		const now = Math.floor(Date.now() / MS_PER_SECOND);
		const cached = userTokenCache.get(userId);
		if (cached !== undefined && now < cached.expiry - TOKEN_CACHE_SKEW_SECONDS) {
			return {
				access_token: cached.token,
				token_type: "bearer",
				expires_in: Math.max(cached.expiry - now, NO_EXPIRY_SECONDS),
				...(cached.realtimeToken === undefined ? {} : { realtime_token: cached.realtimeToken }),
			};
		}

		// Get Supabase admin client
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Sign in as the visitor user (same approach as getSupabaseClientToken)
		const signInResponse = yield* $(
			Effect.tryPromise({
				try: () =>
					client.auth.signInWithPassword({
						email: ctx.env.SUPABASE_VISITOR_EMAIL,
						password: ctx.env.SUPABASE_VISITOR_PASSWORD,
					}),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to sign in visitor user"),
					}),
			}),
		);

		const { data, error } = signInResponse;

		if (error) {
			return yield* $(
				Effect.fail(new DatabaseError({ message: `Sign in failed: ${error.message}` })),
			);
		}

		if (data.session === null || data.user === null) {
			serverLog("[getUserToken] No session or user in sign-in response");
			return yield* $(Effect.fail(new DatabaseError({ message: "No session in response" })));
		}

		// Update the visitor user's app_metadata to include user.user_id and userPublic
		// This allows RLS policies to check for user-specific access and provides
		// accurate identity information to the frontend.
		const newAppMetadata: Record<string, unknown> = {};
		const existingMetadata = data.user.app_metadata;
		if (typeof existingMetadata === "object" && existingMetadata !== null) {
			const asRecord = existingMetadata as Record<string, unknown>;
			for (const key of Object.keys(asRecord)) {
				newAppMetadata[key] = asRecord[key];
			}
		}

		// Sync user identity and userPublic data from the verified session
		// This ensures the JWT contains the correct user_id for RLS policies
		// and the correct username for frontend display.
		newAppMetadata.user = {
			user_id: userId,
		};
		newAppMetadata.userPublic = userSessionData.userPublic;

		let tokenAppMetadata: Record<string, unknown> = newAppMetadata;
		let sessionData = data.session;

		if (metadataMatchesUser(existingMetadata, userId, userSessionData.userPublic.username)) {
			tokenAppMetadata = existingMetadata;
		} else {
			const updateResult = yield* $(
				Effect.tryPromise({
					try: () =>
						client.auth.admin.updateUserById(data.user.id, {
							app_metadata: newAppMetadata,
						}),
					catch: (error) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to update metadata"),
						}),
				}),
			);

			if (updateResult.error) {
				return yield* $(
					Effect.fail(
						new DatabaseError({
							message: `Failed to update metadata: ${updateResult.error.message}`,
						}),
					),
				);
			}

			// Sign in again to get a fresh token with the updated metadata
			const refreshSignInResponse = yield* $(
				Effect.tryPromise({
					try: () =>
						client.auth.signInWithPassword({
							email: ctx.env.SUPABASE_VISITOR_EMAIL,
							password: ctx.env.SUPABASE_VISITOR_PASSWORD,
						}),
					catch: (error) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to refresh sign-in"),
						}),
				}),
			);

			const { data: refreshData, error: refreshError } = refreshSignInResponse;

			if (refreshError) {
				return yield* $(
					Effect.fail(
						new DatabaseError({ message: `Refresh sign-in failed: ${refreshError.message}` }),
					),
				);
			}

			if (!refreshData.session?.access_token) {
				return yield* $(Effect.fail(new DatabaseError({ message: "No access token in response" })));
			}

			sessionData = refreshData.session;
		}

		// GoTrue issues ES256 tokens; PostgREST now also verifies ES256. Return the
		// raw token directly for PostgREST HTTP requests.
		const accessToken = sessionData.access_token;
		const expiresIn = sessionData.expires_in ?? ONE_HOUR_SECONDS;
		const expiresAtRaw = sessionData.expires_at;
		let expiry = now + expiresIn;
		if (typeof expiresAtRaw === "number") {
			expiry = expiresAtRaw;
		} else if (typeof expiresAtRaw === "string") {
			expiry = Number.parseInt(expiresAtRaw, 10) || now + expiresIn;
		}

		// When the legacy HS256 secret is configured, also produce an HS256-signed token
		// for Realtime WebSocket auth. Supabase Realtime still uses the legacy secret.
		const legacySecret = ctx.env.SUPABASE_LEGACY_JWT_SECRET;
		let realtimeToken: string | undefined = undefined;
		if (legacySecret !== undefined && legacySecret !== "") {
			const jwtPayload: Record<string, unknown> = {
				iss: `${ctx.env.VITE_SUPABASE_URL}/auth/v1`,
				sub: data.user.id,
				aud: "authenticated",
				role: "authenticated",
				iat: now,
				exp: now + expiresIn,
				app_metadata: tokenAppMetadata,
			};
			realtimeToken = yield* $(
				Effect.tryPromise({
					try: () => signSupabaseJwtWithLegacySecret(jwtPayload, legacySecret),
					catch: (err) =>
						new DatabaseError({
							message: extractErrorMessage(err, "Failed to sign HS256 JWT"),
						}),
				}),
			);
		}

		userTokenCache.set(userId, {
			token: accessToken,
			expiry,
			...(realtimeToken === undefined ? {} : { realtimeToken }),
		});

		return {
			access_token: accessToken,
			token_type: "bearer",
			expires_in: expiresIn,
			...(realtimeToken === undefined ? {} : { realtime_token: realtimeToken }),
		};
	}).pipe(
		Effect.catchTag("AuthenticationError", (err) =>
			Effect.fail(
				new DatabaseError({
					message: `Authentication failed: ${err.message}`,
				}),
			),
		),
	);
}
