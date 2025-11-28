import { Effect } from "effect";

import { buildClearCookieHeader } from "@/api/cookie/buildClearCookieHeader";
import { userSessionCookieName } from "@/api/cookie/cookie";
import { verifyDoubleSubmitOrThrow } from "@/api/csrf/verifyDoubleSubmitOrThrow";
import { verifySameOriginOrThrow } from "@/api/csrf/verifySameOriginOrThrow";
import { AuthenticationError, DatabaseError } from "@/api/errors";
import { getVerifiedUserSession } from "@/api/user-session/getVerifiedSession";
import { HTTP_FORBIDDEN } from "@/shared/constants/http";
import { type Database } from "@/shared/generated/supabaseTypes";
import { createClient } from "@supabase/supabase-js";

import { type ReadonlyContext } from "../hono/hono-context";

/**
 * Delete an authenticated user's account and clear the session cookie.
 */
export default function accountDelete(
	ctx: ReadonlyContext,
): Effect.Effect<Response, AuthenticationError | DatabaseError> {
	return Effect.gen(function* accountDeleteGen($) {
		// Basic CSRF checks: ensure the request originated from an allowed origin
		// and that the client provided a valid double-submit CSRF token.
		try {
			verifySameOriginOrThrow(ctx);
			verifyDoubleSubmitOrThrow(ctx);
		} catch (err) {
			// Map authentication-related errors to a 403 response so the API
			// surface is clearer instead of returning a 500 internal server error.
			if (err instanceof AuthenticationError) {
				console.warn(
					"CSRF/authentication failure on account delete:",
					err.message,
				);
				// Use shared HTTP constant instead of magic number
				return new Response(JSON.stringify({ error: err.message }), {
					status: HTTP_FORBIDDEN,
					headers: { "Content-Type": "application/json" },
				});
			}
			throw err;
		}
		// Verify session and get decoded session data
		const userSessionData = yield* $(getVerifiedUserSession(ctx));
		const userId = userSessionData.user.user_id;

		// Use service key for backend db operations
		const supabaseUrl = ctx.env.VITE_SUPABASE_URL;
		const supabaseServiceKey = ctx.env.SUPABASE_SERVICE_KEY;
		const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

		// Delete the user row. Other related rows will be removed by ON DELETE CASCADE
		const delUser = yield* $(
			Effect.tryPromise({
				try: async () => supabase.from("user").delete().eq("user_id", userId),
				catch: () => new DatabaseError({ message: "Failed to delete user" }),
			}),
		);

		if (delUser.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Database error deleting user" }),
				),
			);
		}

		// Clear the user session cookie so the browser is signed out
		try {
			const headerValue = buildClearCookieHeader(ctx, userSessionCookieName);
			ctx.res.headers.append("Set-Cookie", headerValue);
		} catch (err) {
			console.error("Failed to set removal cookie header", err);
		}

		return ctx.json({ success: true });
	});
}
