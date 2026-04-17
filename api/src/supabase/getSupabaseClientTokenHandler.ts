import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import handleHttpEndpoint from "@/api/http/handleHttpEndpoint";
import { ONE_HOUR_SECONDS } from "@/shared/constants/http";

import getSupabaseClientToken from "./getSupabaseClientToken";

/**
 * Handler for returning a Supabase visitor client token for client-side use.
 *
 * @param ctx - Hono request context; uses `env` values to generate the token and
 *   returns a JSON response containing `access_token`, `token_type`, `expires_in`,
 *   and optionally `realtime_token` (HS256-signed for Realtime WebSocket auth when
 *   `SUPABASE_LEGACY_JWT_SECRET` is configured).
 * @returns - A JSON HTTP response with the token on success, or a 500 JSON error
 *   response on failure.
 */
export default function getSupabaseClientTokenHandler(
	ctx: ReadonlyContext,
): Promise<Response> {
	return handleHttpEndpoint(
		(ctxArg: ReadonlyContext) =>
			Effect.gen(function* getSupabaseClientTokenEffect() {
				const {
					VITE_SUPABASE_URL,
					SUPABASE_SERVICE_KEY,
					SUPABASE_VISITOR_EMAIL,
					SUPABASE_VISITOR_PASSWORD,
					SUPABASE_LEGACY_JWT_SECRET,
				} = ctxArg.env;
				// exactOptionalPropertyTypes: only include the optional key when it has a value
				const env = {
					VITE_SUPABASE_URL,
					SUPABASE_SERVICE_KEY,
					SUPABASE_VISITOR_EMAIL,
					SUPABASE_VISITOR_PASSWORD,
					...(SUPABASE_LEGACY_JWT_SECRET === undefined
						? {}
						: { SUPABASE_LEGACY_JWT_SECRET }),
				};

				const { accessToken, realtimeToken } = yield* getSupabaseClientToken(env);

				return {
					access_token: accessToken,
					token_type: "bearer",
					// 1 hour
					expires_in: ONE_HOUR_SECONDS,
					...(realtimeToken === undefined ? {} : { realtime_token: realtimeToken }),
				};
			}),
		(data) => data,
	)(ctx);
}
