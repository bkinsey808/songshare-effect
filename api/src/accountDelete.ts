import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import type { Context } from "hono";

import { userSessionCookieName } from "./cookie";
import type { Bindings } from "./env";
import { AuthenticationError, DatabaseError } from "./errors";
import { getVerifiedUserSession } from "./getVerifiedSession";
import type { Database } from "@/shared/generated/supabaseTypes";

/**
 * Delete an authenticated user's account and clear the session cookie.
 */
export default function accountDelete(
	ctx: Context<{ Bindings: Bindings }>,
): Effect.Effect<Response, AuthenticationError | DatabaseError> {
	return Effect.gen(function* ($) {
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
				try: () => supabase.from("user").delete().eq("user_id", userId),
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
			ctx.header(
				"Set-Cookie",
				`${userSessionCookieName}=; HttpOnly; Path=/; Max-Age=0;`,
			);
		} catch (err) {
			console.error("Failed to set removal cookie header", err);
		}

		return ctx.json({ success: true });
	});
}
