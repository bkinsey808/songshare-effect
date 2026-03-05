import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type RemoveSongRequest = {
	song_id: string;
};

/**
 * Extract and validate the request payload for removing a song from a library.
 *
 * Ensures the incoming `request` is an object and contains a `song_id`
 * property of type string. On success a sanitized `RemoveSongRequest` is returned.
 *
 * @param request - The raw request payload (typically parsed JSON).
 * @returns - A validated `RemoveSongRequest` containing `song_id`.
 * @throws - `TypeError` when the request is not an object, is missing required
 *   properties, or when `song_id` is not a string.
 */
function extractRemoveSongRequest(request: unknown): RemoveSongRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("song_id" in request)) {
		throw new TypeError("Request must contain song_id");
	}

	const { song_id } = request as Record<string, unknown>;

	if (typeof song_id !== "string") {
		throw new TypeError("song_id must be a string");
	}

	return { song_id };
}

/**
 * Server-side handler for removing a song from the current user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - deletes the entry from song_library using service key (bypass RLS)
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Success indicator, or fails with an error
 */
export default function removeSongFromLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* removeSongFromLibraryGen($) {
		const requestBody: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request structure
		let req: RemoveSongRequest = { song_id: "" };
		try {
			req = extractRemoveSongRequest(requestBody);
		} catch (error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: extractErrorMessage(error, "Invalid request"),
					}),
				),
			);
		}

		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Delete from song_library using service key
		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client.from("song_library").delete().eq("user_id", userId).eq("song_id", req.song_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to remove song from library"),
					}),
			}),
		);

		const { error: deleteError } = deleteResult;

		if (deleteError !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(deleteError, "Unknown error"),
					}),
				),
			);
		}

		return { success: true };
	});
}
