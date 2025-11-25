import { Effect } from "effect";

// Env type not required — ReadonlyContext default covers the Bindings type
import type { ReadonlyContext } from "@/api/hono/hono-context";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

import { ServerError } from "@/api/errors";
import { createJwt } from "@/api/oauth/createJwt";

type BuildRegisterJwtParams = Readonly<{
	ctx: ReadonlyContext;
	oauthUserData: OauthUserData;
	oauthState: OauthState;
}>;

/**
 * Builds a registration JWT for a new user registration flow.
 *
 * @param params Parameters object
 * @param params.ctx Hono context (for env and request info)
 * @param params.oauthUserData User information returned by the OAuth provider
 * @param params.oauthState The decoded OAuth state object used during the flow
 * @returns Effect yielding the registration JWT string
 */
export function buildRegisterJwt({
	ctx,
	oauthUserData,
	oauthState,
}: BuildRegisterJwtParams): Effect.Effect<string, ServerError> {
	return Effect.gen(function* ($) {
		const registerData = { oauthUserData, oauthState };
		const jwtSecret = ctx.env.JWT_SECRET;
		if (typeof jwtSecret !== "string" || jwtSecret === "") {
			yield* $(
				Effect.sync(() => {
					console.error("[buildRegisterJwt] Missing JWT_SECRET");
				}),
			);
			return yield* $(
				Effect.fail(
					new ServerError({
						message: "Server misconfiguration: missing JWT_SECRET",
					}),
				),
			);
		}
		const registerJwt = yield* $(createJwt(registerData, jwtSecret));
		return registerJwt;
	});
}
