import { Effect } from "effect";

import type { Env } from "@/api/env";
import { ServerError } from "@/api/errors";
import type { ReadonlyContext } from "@/api/hono/hono-context";
import { createJwt } from "@/api/oauth/createJwt";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

type BuildRegisterJwtParams = Readonly<{
	ctx: ReadonlyContext<{ Bindings: Env }>;
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
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
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
