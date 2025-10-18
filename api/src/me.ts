import { Effect, Schema } from "effect";
import type { Context } from "hono";

import type { Bindings } from "./env";
import { AuthenticationError, DatabaseError } from "./errors";
// getErrorMessage was previously used for logging; not needed in the effect-based flow
import { getIpAddress } from "./getIpAddress";
import {
	extractUserSessionTokenFromContext,
	verifyUserSessionToken,
} from "./userSession";
import {
	type UserSessionData,
	UserSessionDataSchema,
} from "@/shared/userSessionData";

/** Effect-based handler for /api/me */
export function me(
	ctx: Context<{ Bindings: Bindings }>,
): Effect.Effect<UserSessionData, AuthenticationError | DatabaseError> {
	return Effect.gen(function* ($) {
		// 1) extract token from cookie (sync)
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
					new DatabaseError({
						message: "Server configuration error",
					}),
				),
			);
		}

		// 3) verify token (async) and map provider errors
		const verified = yield* $(
			verifyUserSessionToken(userSessionToken as string, ctx.env),
		);

		// 4) decode/validate using Schema.decodeUnknown (returns an Effect)
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

		// 5) IP check (sync)
		const ip = getIpAddress(ctx);
		if (userSessionData.ip !== ip) {
			return yield* $(
				Effect.fail(
					new AuthenticationError({
						message: "IP address mismatch",
					}),
				),
			);
		}

		return userSessionData;
	});
}
