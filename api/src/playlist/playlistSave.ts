import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

/**
 * Schema validating playlist form payload.
 *
 * Validates optional `playlist_id`, required `playlist_name` and `playlist_slug`,
 * optional notes, and a `song_order` array of song IDs.
 */
const PlaylistFormSchema = Schema.Struct({
	playlist_id: Schema.optional(Schema.String),
	playlist_name: Schema.String,
	playlist_slug: Schema.String,
	public_notes: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
	song_order: Schema.Array(Schema.String),
});

type PlaylistFormData = Schema.Schema.Type<typeof PlaylistFormSchema>;

/**
 * Server-side handler for saving a playlist. This Effect-based handler:
 * - validates the incoming form payload
 * - creates a private playlist row, then a public playlist row
 * - attempts cleanup if the public insert fails
 *
 * The function returns the created public record or fails with a
 * ValidationError | DatabaseError | AuthenticationError.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The public record that was created in `playlist_public` (or a
 * failed Effect with a ValidationError/DatabaseError/AuthenticationError).
 */
export default function playlistSave(
	ctx: ReadonlyContext,
): Effect.Effect<unknown, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* playlistSaveGen($) {
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

		// Validate form payload
		const validated: PlaylistFormData = yield* $(
			validateFormEffect({
				schema: PlaylistFormSchema,
				data: body,
				i18nMessageKey: "PLAYLIST_FORM",
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

		// Build typed values for DB insertion
		const songOrderForDb: string[] = Array.isArray(validated.song_order)
			? validated.song_order.map(String)
			: [];

		// Create Supabase client with service role key to bypass RLS for writes
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Determine if this is an update or create operation
		const isUpdate = validated.playlist_id !== undefined && validated.playlist_id.trim() !== "";
		const playlistId = isUpdate ? validated.playlist_id : crypto.randomUUID();

		// If updating, verify the user owns the playlist
		if (isUpdate) {
			const existingPlaylist = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase
							.from("playlist_public")
							.select("user_id")
							.eq("playlist_id", playlistId)
							.single(),
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
							message: "You do not have permission to update this playlist",
						}),
					),
				);
			}
		}

		// Update or insert private playlist data
		const privateResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						return supabase
							.from("playlist")
							.update({
								private_notes: validated.private_notes ?? "",
							})
							.eq("playlist_id", playlistId)
							.select()
							.single();
					}
					return supabase
						.from("playlist")
						.insert([
							{
								playlist_id: playlistId,
								user_id: userId,
								private_notes: validated.private_notes ?? "",
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} private playlist: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (privateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: privateResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Update or insert into public table (playlist_public)
		const publicResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						return supabase
							.from("playlist_public")
							.update({
								playlist_name: validated.playlist_name,
								playlist_slug: validated.playlist_slug,
								song_order: songOrderForDb,
								/* oxlint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes ?? null,
							})
							.eq("playlist_id", playlistId)
							.select()
							.single();
					}
					return supabase
						.from("playlist_public")
						.insert([
							{
								playlist_id: playlistId,
								user_id: userId,
								playlist_name: validated.playlist_name,
								playlist_slug: validated.playlist_slug,
								song_order: songOrderForDb,
								/* oxlint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes ?? null,
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} public playlist: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (publicResult.error) {
			// Only attempt cleanup if this was a create operation
			if (!isUpdate) {
				try {
					void Effect.runPromise(
						Effect.tryPromise({
							try: () => supabase.from("playlist").delete().eq("playlist_id", playlistId),
							catch: () => undefined,
						}),
					);
				} catch {
					// Cleanup failed but continue with error reporting
				}
			}
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: publicResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Only add to library if this is a new playlist (updates don't need this)
		if (!isUpdate) {
			yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("playlist_library").insert([
							{
								user_id: userId,
								playlist_id: playlistId,
								playlist_owner_id: userId,
							},
						]),
					catch: (err) => {
						console.warn(
							`Failed to add playlist to library (non-fatal): ${extractErrorMessage(err, "Unknown error")}`,
						);
						return new DatabaseError({
							message: `Playlist created but failed to add to library: ${extractErrorMessage(err, "Unknown error")}`,
						});
					},
				}),
			);
		}

		// Return updated/created public record
		return publicResult.data;
	});
}
