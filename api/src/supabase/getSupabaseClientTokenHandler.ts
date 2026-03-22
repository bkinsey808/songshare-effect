import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { HTTP_INTERNAL, ONE_HOUR_SECONDS } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

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
export default async function getSupabaseClientTokenHandler(
	ctx: ReadonlyContext,
): Promise<Response> {
	try {
		const {
			VITE_SUPABASE_URL,
			SUPABASE_SERVICE_KEY,
			SUPABASE_VISITOR_EMAIL,
			SUPABASE_VISITOR_PASSWORD,
			SUPABASE_LEGACY_JWT_SECRET,
		} = ctx.env;
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

		const accessToken = await getSupabaseClientToken(env);

		return ctx.json({
			access_token: accessToken,
			token_type: "bearer",
			// 1 hour
			expires_in: ONE_HOUR_SECONDS,
		});
	} catch (error) {
		console.error(
			"Failed to generate Supabase client token:",
			extractErrorMessage(error, "Unknown error"),
		);
		return Response.json(
			{ error: "Failed to generate Supabase client token" },
			{
				status: HTTP_INTERNAL,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
