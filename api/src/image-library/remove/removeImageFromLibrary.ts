import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

type RemoveImageRequest = {
	image_id: string;
};

/**
 * Extract and validate the remove-from-library request.
 *
 * @param request - Raw parsed JSON body.
 * @returns - Validated `RemoveImageRequest`.
 * @throws - `TypeError` when required fields are missing or invalid.
 */
function extractRemoveImageRequest(request: unknown): RemoveImageRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}
	if (!("image_id" in request)) {
		throw new TypeError("Request must contain image_id");
	}
	const { image_id } = request as Record<string, unknown>;
	if (typeof image_id !== "string" || image_id.trim() === "") {
		throw new TypeError("image_id must be a non-empty string");
	}
	return { image_id: image_id.trim() };
}

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
				Effect.fail(new ValidationError({ message: extractErrorMessage(error, "Invalid request") })),
			);
		}

		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("image_library")
						.delete()
						.eq("user_id", userId)
						.eq("image_id", req.image_id),
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
						message: extractErrorMessage(
							deleteResult.error,
							"Failed to remove image from library",
						),
					}),
				),
			);
		}

		return { success: true };
	});
}
