import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import extractRemoveTagLibraryRequest, {
	type RemoveTagLibraryRequest,
} from "./extractRemoveTagLibraryRequest";

/**
 * Server-side handler for removing a tag from the current user's tag library.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ success: true }` on success, or fails with a typed error.
 */
export default function removeTagFromLibrary(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* removeTagFromLibraryGen($) {
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: RemoveTagLibraryRequest = { tag_slug: "" };
		try {
			req = extractRemoveTagLibraryRequest(body);
		} catch (error: unknown) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: extractErrorMessage(error, "Invalid request") }),
				),
			);
		}

		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("tag_library")
						.delete()
						.eq("user_id", userId)
						.eq("tag_slug", req.tag_slug),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to remove tag from library"),
					}),
			}),
		);

		if (deleteResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(
							deleteResult.error,
							"Failed to remove tag from library",
						),
					}),
				),
			);
		}

		return { success: true };
	});
}
