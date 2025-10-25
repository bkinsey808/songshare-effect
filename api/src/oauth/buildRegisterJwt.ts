import { Effect } from "effect";
import type { Context } from "hono";

import type { Env } from "@/api/env";
import { ServerError } from "@/api/errors";
import { createJwt } from "@/api/oauth/createJwt";
import type { OauthState } from "@/shared/oauth/oauthState";
/**
 * Builds a registration JWT for a new user registration flow.
 *
 * @param ctx Hono context (for env and request info)
 * @param registerData Registration data object (oauthUserData, oauthState)
 * @returns Effect yielding the registration JWT string
 */
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

export function buildRegisterJwt(
	ctx: Context<{ Bindings: Env }>,
	oauthUserData: OauthUserData,
	oauthState: OauthState,
): Effect.Effect<string, ServerError> {
	return Effect.gen(function* ($) {
		const registerData = { oauthUserData, oauthState };
		const jwtSecret = ctx.env.JWT_SECRET;
		if (typeof jwtSecret !== "string" || jwtSecret === "") {
			yield* $(
				Effect.sync(() =>
					console.error("[buildRegisterJwt] Missing JWT_SECRET"),
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
		const registerJwt = yield* $(createJwt(registerData, jwtSecret as string));
		return registerJwt;
	});
}
