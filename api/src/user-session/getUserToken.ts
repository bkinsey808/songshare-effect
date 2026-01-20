import { Effect } from "effect";

import { log as serverLog } from "@/api/logger";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import { ONE_HOUR_SECONDS } from "@/shared/constants/http";

import { DatabaseError } from "../errors";
import { type ReadonlyContext } from "../hono/hono-context";
import getVerifiedUserSession from "./getVerifiedSession";

type TokenResponse = Readonly<{
	access_token: string;
	token_type: string;
	expires_in: number;
}>;

/**
 * Get a Supabase-compatible JWT token for the currently authenticated user.
 *
 * Uses the same Supabase visitor auth user but updates app_metadata with user.user_id
 * for RLS to distinguish between visitor and user access.
 *
 * This follows the same pattern as getSupabaseClientToken but adds user metadata
 * instead of visitor_id.
 */
export default function getUserToken(
	ctx: ReadonlyContext,
): Effect.Effect<TokenResponse, DatabaseError> {
	return Effect.gen(function* getUserTokenGen($) {
		serverLog("[getUserToken] Starting token generation");

		// Verify the user session first
		const userSessionData = yield* $(getVerifiedUserSession(ctx));
		const userId = userSessionData.user.user_id;

		serverLog("[getUserToken] Getting Supabase token for user:", userId);

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
						message: `Failed to sign in visitor user: ${error instanceof Error ? error.message : String(error)}`,
					}),
			}),
		);

		const { data, error } = signInResponse;

		if (error) {
			serverLog("[getUserToken] Sign in error:", error.message);
			return yield* $(
				Effect.fail(new DatabaseError({ message: `Sign in failed: ${error.message}` })),
			);
		}

		if (data.session === null || data.user === null) {
			serverLog("[getUserToken] No session or user in sign-in response");
			return yield* $(Effect.fail(new DatabaseError({ message: "No session in response" })));
		}

		// Update the visitor user's app_metadata to include user.user_id
		// This allows RLS policies to check for user-specific access
		const newAppMetadata: Record<string, unknown> = {};
		const existingMetadata = data.user.app_metadata;
		if (typeof existingMetadata === "object" && existingMetadata !== null) {
			const asRecord = existingMetadata as Record<string, unknown>;
			for (const key of Object.keys(asRecord)) {
				newAppMetadata[key] = asRecord[key];
			}
		}
		// Add user metadata for RLS
		newAppMetadata.user = {
			user_id: userId,
		};

		serverLog("[getUserToken] Updating visitor user metadata with user_id:", userId);

		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client.auth.admin.updateUserById(data.user.id, {
						app_metadata: newAppMetadata,
					}),
				catch: (error) =>
					new DatabaseError({
						message: `Failed to update metadata: ${error instanceof Error ? error.message : String(error)}`,
					}),
			}),
		);

		if (updateResult.error) {
			serverLog("[getUserToken] Metadata update error:", updateResult.error.message);
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: `Failed to update metadata: ${updateResult.error.message}`,
					}),
				),
			);
		}

		// Sign in again to get a fresh token with the updated metadata
		serverLog("[getUserToken] Signing in again to get fresh token with user metadata");

		const refreshSignInResponse = yield* $(
			Effect.tryPromise({
				try: () =>
					client.auth.signInWithPassword({
						email: ctx.env.SUPABASE_VISITOR_EMAIL,
						password: ctx.env.SUPABASE_VISITOR_PASSWORD,
					}),
				catch: (error) =>
					new DatabaseError({
						message: `Failed to refresh sign-in: ${error instanceof Error ? error.message : String(error)}`,
					}),
			}),
		);

		const { data: refreshData, error: refreshError } = refreshSignInResponse;

		if (refreshError) {
			serverLog("[getUserToken] Refresh sign-in error:", refreshError.message);
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: `Refresh sign-in failed: ${refreshError.message}` }),
				),
			);
		}

		if (!refreshData.session?.access_token) {
			serverLog("[getUserToken] No access token in refresh response");
			return yield* $(Effect.fail(new DatabaseError({ message: "No access token in response" })));
		}

		serverLog("[getUserToken] Successfully generated token for user:", userId);

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
