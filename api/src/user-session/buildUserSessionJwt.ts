// SupabaseClient is not used directly here; use ReadonlySupabaseClient alias below
import { Effect } from "effect";

// Types now live in `api/src/types/user-session.ts`
import { type DatabaseError, ServerError, ValidationError } from "@/api/api-errors";
import getIpAddress from "@/api/getIpAddress";
import createJwt from "@/api/oauth/createJwt";
import resolveUsername from "@/api/user/resolveUsername";
import { type User } from "@/shared/generated/supabaseSchemas";
import { type ReadonlyOauthState } from "@/shared/oauth/oauthState";
import { type ReadonlyOauthUserData } from "@/shared/oauth/oauthUserData";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";
import { UserSessionDataSchema as sessionDataSchema } from "@/shared/userSessionData";
import decodeUnknownEffectOrMap from "@/shared/validation/decodeUnknownEffectOrMap";

// Env type not required — ReadonlyContext default covers Bindings
import type { ReadonlyContext } from "../hono/ReadonlyContext.type";
import { type ReadonlySupabaseClient } from "../supabase/ReadonlySupabaseClient.type";

type ReadonlyUser = ReadonlyDeep<User>;

// The `ctx` parameter is intentionally not wrapped by `ReadonlyDeep`
// because converting all nested `Context` fields to readonly can lead to
// incompatible shapes (e.g. readonly arrays vs mutable arrays) when the
// context is passed to other helpers like `getIpAddress`.
type BuildUserSessionJwtParams = ReadonlyDeep<{
	readonly supabase: ReadonlySupabaseClient;
	readonly existingUser: ReadonlyUser;
	readonly oauthUserData: ReadonlyOauthUserData;
	readonly oauthState: ReadonlyOauthState;
}> & { readonly ctx: ReadonlyContext };

/**
 * Builds a user session JWT for an authenticated user.
 *
 * - Resolves the username from user_public table (source of truth for username)
 * - Constructs the session data object
 * - Validates the session data using Effect Schema
 * - Signs and returns the JWT
 *
 * @param ctx - Hono context (for env and request info)
 * @param supabase - Supabase client instance
 * @param existingUser - The authenticated user object
 * @param oauthUserData - OAuth user data
 * @param oauthState - OAuth state
 * @returns Effect yielding the session JWT string
 */
export default function buildUserSessionJwt({
	ctx,
	supabase,
	existingUser,
	oauthUserData,
	oauthState,
}: BuildUserSessionJwtParams): Effect.Effect<
	string,
	ValidationError | ServerError | DatabaseError
> {
	return Effect.gen(function* buildUserSessionJwtGen($) {
		const ip = getIpAddress(ctx);
		// Resolve username from user_public table (source of truth for username)
		const username = yield* $(
			resolveUsername(supabase, {
				user_id: existingUser.user_id,
				name: existingUser.name,
			}),
		);
		const finalUsername = username ?? existingUser.name;

		// Strip null values from the user object so schema optional fields
		// (string | undefined) don't fail validation — Supabase returns null for
		// absent columns but the Effect schema uses Schema.optional which accepts
		// absent/undefined, not null.
		const cleanUser = Object.fromEntries(
			Object.entries(existingUser as Record<string, unknown>).filter(([, val]) => val !== null),
		);

		// Create user session data
		const sessionData = {
			user: cleanUser,
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
			Effect.sync(() => {
				console.warn(
					"[buildUserSessionJwt] Validating sessionData for user:",
					existingUser?.user_id,
				);
			}),
		);

		// The decode may produce an error value typed as unknown; map to a
		// ValidationError. We intentionally discard the original error shape.
		yield* $(
			decodeUnknownEffectOrMap(
				sessionDataSchema,
				sessionData,
				() => new ValidationError({ message: "Invalid session" }),
			),
		);

		const jwtSecretFinal = ctx.env.SUPABASE_JWT_SECRET;

		if (typeof jwtSecretFinal !== "string" || jwtSecretFinal === "") {
			yield* $(
				Effect.sync(() => {
					console.error("[buildUserSessionJwt] Missing SUPABASE_JWT_SECRET");
				}),
			);
			return yield* $(
				Effect.fail(
					new ServerError({
						message: "Server misconfiguration: missing SUPABASE_JWT_SECRET",
					}),
				),
			);
		}

		const sessionJwt = yield* $(createJwt(sessionData, jwtSecretFinal));
		return sessionJwt;
	});
}
