import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type PlaylistLibrary } from "@/shared/generated/supabaseSchemas";

import type { AddPlaylistRequest } from "./AddPlaylistRequest.type";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import addPlaylistSongsToUserLibrary from "./addPlaylistSongsToUserLibrary";
import extractAddPlaylistRequest from "./extractAddPlaylistRequest";
import performPlaylistLibraryInsert from "./performPlaylistLibraryInsert";

/**
 * Server-side handler for adding a playlist to user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - inserts the entry into playlist_library using service key (bypass RLS)
 * - also adds all songs from the playlist to the user's song library
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The inserted playlist library entry, or fails with an error
 */
export default function addPlaylistToLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<PlaylistLibrary, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addPlaylistToLibraryGen($) {
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
		let req: AddPlaylistRequest = { playlist_id: "", playlist_owner_id: "" };
		try {
			req = extractAddPlaylistRequest(requestBody);
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

		// Insert into playlist_library using service key
		const insertResult = yield* $(performPlaylistLibraryInsert(client, userId, req));

		const { data, error: insertError } = insertResult;

		if (insertError !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(insertError, "Unknown error"),
					}),
				),
			);
		}

		if (data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "No data returned from insert" })));
		}

		// Also add all songs from the playlist to the user's song library
		// This is done after the playlist is added so we don't leave partial state
		yield* $(addPlaylistSongsToUserLibrary(client, userId, req.playlist_id));

		const libraryEntry: PlaylistLibrary = {
			created_at: data.created_at,
			playlist_id: data.playlist_id,
			playlist_owner_id: data.playlist_owner_id,
			user_id: data.user_id,
		};

		return libraryEntry;
	});
}
