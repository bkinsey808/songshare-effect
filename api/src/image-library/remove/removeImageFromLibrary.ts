import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import extractRemoveImageRequest, { type RemoveImageRequest } from "./extractRemoveImageRequest";

/**
 * Server-side handler for removing an image from the current user's library.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ success: true }` on success, or fails with a typed error.
 */
export default function removeImageFromLibrary(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* removeImageGen($) {
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: RemoveImageRequest = { image_id: "" };
		try {
			req = extractRemoveImageRequest(body);
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
					client.from("image_library").delete().eq("user_id", userId).eq("image_id", req.image_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to remove image from library"),
					}),
			}),
		);

		if (deleteResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(deleteResult.error, "Failed to remove image from library"),
					}),
				),
			);
		}

		return { success: true };
	});
}
