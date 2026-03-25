import { Effect } from "effect";

import { type AuthenticationError, DatabaseError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;

/**
 * Server-side handler for searching the current user's tag library.
 * Used for autocomplete on item edit pages.
 *
 * Query params:
 *   q     - search string (matched with ILIKE %q%)
 *   limit - max results (default 10)
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ tags: string[] }` matching the query, or fails with a typed error.
 */
export default function tagSearch(
	ctx: ReadonlyContext,
): Effect.Effect<{ tags: string[] }, DatabaseError | AuthenticationError> {
	return Effect.gen(function* tagSearchGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const searchQuery = ctx.req.query("q") ?? "";
		const limitParam = ctx.req.query("limit");
		const parsedLimit = limitParam === undefined ? DEFAULT_LIMIT : Number.parseInt(limitParam, 10);
		const safeLimit =
			Number.isNaN(parsedLimit) || parsedLimit < MIN_LIMIT ? DEFAULT_LIMIT : parsedLimit;

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		const searchResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("tag_library")
						.select("tag_slug")
						.eq("user_id", userId)
						.ilike("tag_slug", `%${searchQuery}%`)
						.order("tag_slug")
						.limit(safeLimit),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to search tags"),
					}),
			}),
		);

		if (searchResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(searchResult.error, "Failed to search tags"),
					}),
				),
			);
		}

		const tags = (searchResult.data ?? []).map((row) => row.tag_slug);
		return { tags };
	});
}
