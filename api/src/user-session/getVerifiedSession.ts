import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { AuthenticationError, DatabaseError } from "@/api/api-errors";
import extractUserSessionTokenFromContext from "@/api/user-session/extractUserSessionTokenFromContext";
import verifyUserSessionToken from "@/api/user-session/verifyUserSessionToken";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type UserSessionData, UserSessionDataSchema } from "@/shared/userSessionData";
import decodeUnknownEffectOrMap from "@/shared/validation/decode-effect";

/**
 * Verify and decode the current user's session JWT.
 *
 * This helper extracts a session token from the request context, verifies
 * it using server configuration (JWT secret), and validates the decoded
 * payload against the `UserSessionData` schema. It is intended for reuse by
 * API handlers that require an authenticated user.
 *
 * @param ctx - The readonly request context providing cookies and environment.
 * @returns - An Effect that resolves to validated `UserSessionData` on success.
 *   If the session is missing or invalid the Effect fails with an
 *   `AuthenticationError`. If required server configuration is missing the
 *   Effect fails with a `DatabaseError`.
 */
export default function getVerifiedUserSession(
	ctx: ReadonlyContext,
): Effect.Effect<UserSessionData, AuthenticationError | DatabaseError> {
	return Effect.gen(function* getVerifiedUserSession($) {
		// 1) extract token from cookie
		const userSessionToken = yield* $(extractUserSessionTokenFromContext(ctx));

		if (typeof userSessionToken !== "string" || userSessionToken === "") {
			return yield* $(Effect.fail(new AuthenticationError({ message: "Not authenticated" })));
		}

		// 2) ensure JWT secret present
		const jwtSecret = ctx.env.JWT_SECRET;
		if (jwtSecret === undefined || jwtSecret === "") {
			console.error("Missing JWT_SECRET in environment");
			return yield* $(Effect.fail(new DatabaseError({ message: "Server configuration error" })));
		}

		// 3) verify token
		const verified = yield* $(verifyUserSessionToken(userSessionToken, ctx.env));

		// 4) decode/validate using schema
		const userSessionData = yield* $(
			decodeUnknownEffectOrMap(
				UserSessionDataSchema,
				verified,
				(err) =>
					new AuthenticationError({
						message: extractErrorMessage(err ?? "Invalid session", "Invalid session"),
					}),
			),
		);

		return userSessionData;
	});
}
