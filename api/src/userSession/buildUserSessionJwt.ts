import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import type { Context } from "hono";

import type { Env } from "@/api/env";
import { type DatabaseError, ServerError, ValidationError } from "@/api/errors";
import { getIpAddress } from "@/api/getIpAddress";
import { createJwt } from "@/api/oauth/createJwt";
import { resolveUsername } from "@/api/user/resolveUsername";
import type { User } from "@/shared/generated/supabaseSchemas";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";
import { UserSessionDataSchema as sessionDataSchema } from "@/shared/userSessionData";

/**
 * Builds a user session JWT for an authenticated user.
 *
 * - Resolves the username from user_public table (source of truth for username)
 * - Constructs the session data object
 * - Validates the session data using Effect Schema
 * - Signs and returns the JWT
 *
 * @param params Parameters object
 * @param params.ctx Hono context (for env and request info)
 * @param params.supabase Supabase client instance
 * @param params.existingUser The authenticated user object
 * @param params.oauthUserData OAuth user data
 * @param params.oauthState OAuth state
 * @returns Effect yielding the session JWT string
 */
export function buildUserSessionJwt({
	ctx,
	supabase,
	existingUser,
	oauthUserData,
	oauthState,
}: {
	ctx: Context<{ Bindings: Env }>;
	supabase: SupabaseClient;
	existingUser: User;
	oauthUserData: OauthUserData;
	oauthState: OauthState;
}): Effect.Effect<string, ValidationError | ServerError | DatabaseError> {
	return Effect.gen(function* ($) {
		const ip = getIpAddress(ctx);
		// Resolve username from user_public table (source of truth for username)
		const username = yield* $(
			resolveUsername(supabase, {
				user_id: existingUser.user_id,
				name: existingUser.name,
			}),
		);
		const finalUsername = username ?? existingUser.name;

		// Create user session data
		const sessionData = {
			user: existingUser,
			userPublic: {
				user_id: existingUser.user_id,
				username: finalUsername,
			},
			oauthUserData,
			oauthState,
			ip,
		};

		// Validate using Effect Schema (throws if invalid)
		yield* $(
			Effect.sync(() =>
				console.warn(
					"[buildUserSessionJwt] Validating sessionData for user:",
					existingUser?.user_id,
				),
			),
		);

		yield* $(
			Schema.decodeUnknown(sessionDataSchema)(sessionData).pipe(
				Effect.mapError(
					(err) =>
						new ValidationError({
							message:
								typeof err === "object" && "message" in err
									? String((err as { message?: unknown }).message)
									: "Invalid session",
						}),
				),
			),
		);

		const jwtSecretFinal = ctx.env.JWT_SECRET;

		if (typeof jwtSecretFinal !== "string" || jwtSecretFinal === "") {
			yield* $(
				Effect.sync(() =>
					console.error("[buildUserSessionJwt] Missing JWT_SECRET"),
				),
			);
			return yield* $(
				Effect.fail(
					new ServerError({
						message: "Server misconfiguration: missing JWT_SECRET",
					}),
				),
			);
		}

		const sessionJwt = yield* $(
			createJwt(sessionData, jwtSecretFinal as string),
		);
		return sessionJwt;
	});
}
