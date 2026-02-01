import { Effect } from "effect";

import { type ReadonlyContext } from "@/api/hono/hono-context";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import { type AuthenticationError, DatabaseError, ValidationError } from "../errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type RemovePlaylistRequest = {
	playlist_id: string;
};

/**
 * Extract request data with validation
 */
function extractRemovePlaylistRequest(request: unknown): RemovePlaylistRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("playlist_id" in request)) {
		throw new TypeError("Request must contain playlist_id");
	}

	const { playlist_id } = request as Record<string, unknown>;

	if (typeof playlist_id !== "string") {
		throw new TypeError("playlist_id must be a string");
	}

	return { playlist_id };
}

/**
 * Server-side handler for removing a playlist from user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - deletes the entry from playlist_library using service key (bypass RLS)
 *
 * Note: This does NOT remove songs from the user's song library.
 * Songs added from a playlist remain in the user's library.
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Success indicator, or fails with an error
 */
export default function removePlaylistFromLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* removePlaylistFromLibraryGen($) {
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
		let req: RemovePlaylistRequest = { playlist_id: "" };
		try {
			req = extractRemovePlaylistRequest(requestBody);
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

		// Delete from playlist_library using service key
		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("playlist_library")
						.delete()
						.eq("user_id", userId)
						.eq("playlist_id", req.playlist_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to remove playlist from library"),
					}),
			}),
		);

		if (deleteResult.error !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(deleteResult.error, "Unknown error"),
					}),
				),
			);
		}

		return { success: true };
	});
}
