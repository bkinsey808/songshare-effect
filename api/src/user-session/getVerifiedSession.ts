import { Effect } from "effect";

import { AuthenticationError, DatabaseError } from "@/api/errors";
import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import {
	extractUserSessionTokenFromContext,
	verifyUserSessionToken,
} from "@/api/user-session/userSession";
import { type UserSessionData, UserSessionDataSchema } from "@/shared/userSessionData";
import decodeUnknownEffectOrMap from "@/shared/validation/decode-effect";

/**
 * Verify user session JWT and return decoded `UserSessionData`.
 * Reusable helper for API handlers that need an authenticated user.
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
						message: getErrorMessage(err ?? "Invalid session"),
					}),
			),
		);

		return userSessionData;
	});
}
