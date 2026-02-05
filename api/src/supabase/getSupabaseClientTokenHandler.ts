import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { HTTP_INTERNAL, ONE_HOUR_SECONDS } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import getSupabaseClientToken from "./getSupabaseClientToken";

/**
 * Handler for returning a Supabase visitor client token for client-side use.
 *
 * @param ctx - Hono request context; uses `env` values to generate the token and
 *   returns a JSON response containing `access_token`, `token_type`, and
 *   `expires_in`.
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
		} = ctx.env;
		const env = {
			VITE_SUPABASE_URL,
			SUPABASE_SERVICE_KEY,
			SUPABASE_VISITOR_EMAIL,
			SUPABASE_VISITOR_PASSWORD,
		};

		const supabaseClientToken = await getSupabaseClientToken(env);

		return ctx.json({
			access_token: supabaseClientToken,
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
