import { Effect, Schema } from "effect";
import type { Context } from "hono";

import type { Bindings } from "@/api/env";
import { AuthenticationError, DatabaseError } from "@/api/errors";
import {
	extractUserSessionTokenFromContext,
	verifyUserSessionToken,
} from "@/api/userSession/userSession";
import {
	type UserSessionData,
	UserSessionDataSchema,
} from "@/shared/userSessionData";

/**
 * Verify user session JWT and return decoded `UserSessionData`.
 * Reusable helper for API handlers that need an authenticated user.
 */
export const getVerifiedUserSession = (
	ctx: Context<{ Bindings: Bindings }>,
): Effect.Effect<UserSessionData, AuthenticationError | DatabaseError> =>
	Effect.gen(function* ($) {
		// 1) extract token from cookie
		const userSessionToken = yield* $(extractUserSessionTokenFromContext(ctx));

		if (userSessionToken === undefined) {
			return yield* $(
				Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
			);
		}

		// 2) ensure JWT secret present
		const jwtSecret = ctx.env.JWT_SECRET;
		if (jwtSecret === undefined || jwtSecret === "") {
			console.error("Missing JWT_SECRET in environment");
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Server configuration error" }),
				),
			);
		}

		// 3) verify token
		const verified = yield* $(
			verifyUserSessionToken(userSessionToken as string, ctx.env),
		);

		// 4) decode/validate using schema
		const userSessionData = yield* $(
			Schema.decodeUnknown(UserSessionDataSchema)(verified as unknown).pipe(
				Effect.mapError(
					(err) =>
						new AuthenticationError({
							message: String(err?.message ?? "Invalid session"),
						}),
				),
			),
		);

		return userSessionData;
	});
