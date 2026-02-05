import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

/**
 * Schema validating payload for deleting a playlist.
 *
 * Expected shape: `{ playlist_id: string }`.
 */
const PlaylistDeleteSchema = Schema.Struct({
	playlist_id: Schema.String,
});

type PlaylistDeleteData = Schema.Schema.Type<typeof PlaylistDeleteSchema>;

/**
 * Server-side handler for deleting a playlist. This Effect-based handler:
 * - validates the incoming request
 * - verifies the user owns the playlist
 * - deletes the playlist_library entries, then public and private playlist data
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function playlistDelete(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* playlistDeleteGen($) {
		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Parse JSON body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request payload
		const validated: PlaylistDeleteData = yield* $(
			validateFormEffect({
				schema: PlaylistDeleteSchema,
				data: body,
				i18nMessageKey: "PLAYLIST_DELETE",
			}).pipe(
				Effect.mapError((errs) => {
					const first =
						Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

		const playlistId = validated.playlist_id;

		// Create Supabase client with service role key to bypass RLS
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the user owns the playlist
		const existingPlaylist = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("playlist").select("user_id").eq("playlist_id", playlistId).single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify playlist ownership: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (existingPlaylist.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: existingPlaylist.error?.message ?? "Playlist not found",
					}),
				),
			);
		}

		if (existingPlaylist.data?.user_id !== userId) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "You do not have permission to delete this playlist",
					}),
				),
			);
		}

		// Delete all playlist_library entries for this playlist
		yield* $(
			Effect.tryPromise({
				try: () => supabase.from("playlist_library").delete().eq("playlist_id", playlistId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to remove playlist from libraries: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		// Delete the public playlist data
		yield* $(
			Effect.tryPromise({
				try: () => supabase.from("playlist_public").delete().eq("playlist_id", playlistId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to delete public playlist: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		// Delete the private playlist data
		yield* $(
			Effect.tryPromise({
				try: () => supabase.from("playlist").delete().eq("playlist_id", playlistId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to delete private playlist: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		return { success: true };
	});
}
