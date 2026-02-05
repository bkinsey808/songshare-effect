import { Effect } from "effect";

import { log as serverLog } from "@/api/logger";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import { ONE_HOUR_SECONDS } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { ReadonlyContext } from "../hono/ReadonlyContext.type";

import { DatabaseError } from "../api-errors";
import getVerifiedUserSession from "./getVerifiedSession";

type TokenResponse = Readonly<{
	access_token: string;
	token_type: string;
	expires_in: number;
}>;

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

		serverLog(
			`[getUserToken] Syncing metadata for user: ${userId} (${userSessionData.userPublic.username})`,
		);

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

		return {
			access_token: refreshData.session.access_token,
			token_type: "bearer",
			expires_in: refreshData.session.expires_in ?? ONE_HOUR_SECONDS,
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
