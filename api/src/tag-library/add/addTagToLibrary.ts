import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import extractAddTagLibraryRequest, {
	type AddTagLibraryRequest,
} from "./extractAddTagLibraryRequest";

/**
 * Server-side handler for adding a tag to the current user's tag library.
 * Creates the tag in the global tag registry if it does not already exist.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ success: true }` on success, or fails with a typed error.
 */
export default function addTagToLibrary(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addTagToLibraryGen($) {
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: AddTagLibraryRequest = { tag_slug: "" };
		try {
			req = extractAddTagLibraryRequest(body);
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

		// Upsert the tag into the global registry (no-op if already exists)
		const upsertTagResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("tag")
						.upsert({ tag_slug: req.tag_slug }, { onConflict: "tag_slug", ignoreDuplicates: true }),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to upsert tag"),
					}),
			}),
		);

		if (upsertTagResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(upsertTagResult.error, "Failed to upsert tag"),
					}),
				),
			);
		}

		// Insert into user's tag library (no-op if already bookmarked)
		const insertResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("tag_library")
						.upsert(
							{ user_id: userId, tag_slug: req.tag_slug },
							{ onConflict: "user_id,tag_slug", ignoreDuplicates: true },
						),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to add tag to library"),
					}),
			}),
		);

		if (insertResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(insertResult.error, "Failed to add tag to library"),
					}),
				),
			);
		}

		return { success: true };
	});
}
