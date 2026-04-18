import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { SongPublicInsertSchema } from "@/shared/generated/supabaseSchemas";
import { type Database, type Json } from "@/shared/generated/supabaseTypes";
import deriveSongChords from "@/shared/song/deriveSongChords";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";
import { tagSlugSchema } from "@/shared/validation/tagSchemas";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import sanitizeSlidesForDb from "./sanitizeSlidesForDb";

/**
 * Schema validating song form payload.
 *
 * Ensures the presence and shape of song language fields, `slide_order`,
 * and `slides` records. This keeps validation close to the API boundary to
 * prevent malformed data from reaching database code.
 */
const SongFormSchema = Schema.Struct({
	song_id: Schema.optional(Schema.String),
	song_name: Schema.String,
	song_slug: Schema.String,
	lyrics: Schema.optional(Schema.Array(Schema.String)),
	script: Schema.optional(Schema.Array(Schema.String)),
	translations: Schema.Array(Schema.NonEmptyString),
	chords: Schema.optional(Schema.Array(Schema.String)),
	key: SongPublicInsertSchema.fields.key,
	short_credit: Schema.optional(Schema.String),
	long_credit: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
	public_notes: Schema.optional(Schema.String),
	slide_order: Schema.Array(Schema.String),
	tags: Schema.optional(Schema.Array(Schema.String)),
	slides: Schema.Record({
		key: Schema.String,
		value: Schema.Struct({
			slide_name: Schema.String,
			field_data: Schema.Record({
				key: Schema.String,
				value: Schema.String,
			}),
			background_image_id: Schema.optional(Schema.String),
			background_image_url: Schema.optional(Schema.String),
			background_image_width: Schema.optional(Schema.Number),
			background_image_height: Schema.optional(Schema.Number),
			background_image_focal_point_x: Schema.optional(Schema.Number),
			background_image_focal_point_y: Schema.optional(Schema.Number),
		}),
	}),
});

type SongFormData = Schema.Schema.Type<typeof SongFormSchema>;

/**
 * Server-side handler for saving a song. This Effect-based handler:
 * - validates the incoming form payload
 * - creates a private song row, then a public song row
 * - attempts cleanup if the public insert fails
 *
 * The function returns the created public record or fails with a
 * ValidationError | DatabaseError | AuthenticationError.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The public record that was created in `song_public` (or a
 * failed Effect with a ValidationError/DatabaseError/AuthenticationError).
 */
export default function songSave(
	ctx: ReadonlyContext,
): Effect.Effect<unknown, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* songSaveGen($) {
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
		// Validate form payload - directly use the schema without casting
		const validated: SongFormData = yield* $(
			validateFormEffect({
				schema: SongFormSchema,
				data: body,
				i18nMessageKey: "SONG_FORM",
			}).pipe(
				/**
				 * Map validation issues to a structured ValidationError.
				 *
				 * NOTE: the underlying schema-validator may produce terse messages
				 * like "is missing" which are not helpful by themselves. Prefer
				 * including the issue path (e.g. `slides.0.field_data.title`) along
				 * with the message when surface-level reporting is required.
				 */
				Effect.mapError((errs) => {
					// Pick first error to return a structured ValidationError.
					// Prefer the explicit first element over `find` for clarity.
					const first = Array.isArray(errs) && errs.length > ZERO ? errs[ZERO] : undefined;
					// If the validator provided a `field`, include it with the message so
					// callers don't receive terse messages like "is missing" with no context.
					let combinedMessage = "Validation failed";
					if (first) {
						if (first.field) {
							combinedMessage = `${first.field}: ${String(first.message ?? "")}`;
						} else {
							combinedMessage = String(first.message ?? "Validation failed");
						}
					}
					return new ValidationError({
						message: combinedMessage,
					});
				}),
			),
		);
		// Build strongly-typed values for DB insertion to avoid unsafe assertions.
		// Use runtime checks and safe coercions so ESLint/TS won't require `as` casts.
		const slideOrderForDb: string[] = Array.isArray(validated.slide_order)
			? validated.slide_order.map(String)
			: [];
		const translationsForDb: string[] = Array.isArray(validated.translations)
			? validated.translations.map(String)
			: [];
		/* oxlint-disable-next-line unicorn/no-null */
		const keyForDb = validated.key === undefined ? null : validated.key;
		const effectiveLyrics: string[] =
			Array.isArray(validated.lyrics) && validated.lyrics.length > ZERO
				? validated.lyrics.map(String)
				: ["en"];
		const scriptForDb: string[] = Array.isArray(validated.script)
			? validated.script.map(String)
			: [];
		const slidesForDb: Json = sanitizeSlidesForDb(validated.slides, {
			lyrics: effectiveLyrics,
			script: scriptForDb,
			translations: translationsForDb,
		});
		const chordsForDb = deriveSongChords({
			slideOrder: slideOrderForDb,
			slides: slidesForDb,
			existingChords: validated.chords,
		});
		// Create Supabase client with service role key to bypass RLS for writes
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);
		// Determine if this is an update or create operation
		const isUpdate = validated.song_id !== undefined && validated.song_id.trim() !== "";
		const songId = isUpdate ? validated.song_id : crypto.randomUUID();
		// If updating, verify the user owns the song
		if (isUpdate) {
			const existingSong = yield* $(
				Effect.tryPromise({
					try: () => supabase.from("song_public").select("user_id").eq("song_id", songId).single(),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to verify song ownership: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (existingSong.error) {
				return yield* $(
					Effect.fail(
						new DatabaseError({
							message: existingSong.error?.message ?? "Song not found",
						}),
					),
				);
			}

			if (existingSong.data?.user_id !== userId) {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "You do not have permission to update this song",
						}),
					),
				);
			}
		}

		// Update or insert private song data
		const privateResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						return supabase
							.from("song")
							.update({
								private_notes: validated.private_notes ?? "",
							})
							.eq("song_id", songId)
							.select()
							.single();
					}
					return supabase
						.from("song")
						.insert([
							{
								song_id: songId,
								user_id: userId,
								private_notes: validated.private_notes ?? "",
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} private song: ${extractErrorMessage(err, "Unknown error")}`,
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

		// Update or insert into public table (song_public) — fields that are safe for sharing
		const publicResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						return supabase
							.from("song_public")
							.update({
								song_name: validated.song_name,
								song_slug: validated.song_slug,
								lyrics: effectiveLyrics,
								script: scriptForDb,
								translations: translationsForDb,
								chords: chordsForDb,
								/* oxlint-disable-next-line unicorn/no-null */
								key: keyForDb,
								slide_order: slideOrderForDb,
								slides: slidesForDb,
								/* oxlint-disable-next-line unicorn/no-null */
								short_credit: validated.short_credit ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								long_credit: validated.long_credit ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes ?? null,
							})
							.eq("song_id", songId)
							.select()
							.single();
					}
					return supabase
						.from("song_public")
						.insert([
							{
								song_id: songId,
								user_id: userId,
								song_name: validated.song_name,
								song_slug: validated.song_slug,
								lyrics: effectiveLyrics,
								script: scriptForDb,
								translations: translationsForDb,
								chords: chordsForDb,
								key: keyForDb,
								slide_order: slideOrderForDb,
								slides: slidesForDb,
								/* oxlint-disable-next-line unicorn/no-null */
								short_credit: validated.short_credit ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								long_credit: validated.long_credit ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes ?? null,
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} public song: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (publicResult.error) {
			// Only attempt cleanup if this was a create operation
			if (!isUpdate) {
				// Fire-and-forget cleanup of the private song record if public insert failed.
				// We use Effect.runPromise but ensure it cannot fail to avoid unhandled rejections.
				void Effect.runPromise(
					Effect.tryPromise({
						try: () => supabase.from("song").delete().eq("song_id", songId),
						catch: () => undefined,
					}).pipe(Effect.catchAll(() => Effect.void)),
				);
			}
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: publicResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Save tags if provided: replace all existing song_tag rows and update tag_library.
		if (validated.tags !== undefined && songId !== undefined) {
			const validSlugs = validated.tags.filter((slug) => Schema.is(tagSlugSchema)(slug));
			yield* $(
				Effect.tryPromise({
					try: async () => {
						if (validSlugs.length > ZERO) {
							const tagUpsertResult = await supabase.from("tag").upsert(
								validSlugs.map((slug) => ({ tag_slug: slug })),
								{ onConflict: "tag_slug", ignoreDuplicates: true },
							);
							if (tagUpsertResult.error) {
								throw new DatabaseError({
									message: tagUpsertResult.error.message ?? "Failed to upsert tags",
								});
							}
						}
						const deleteResult = await supabase.from("song_tag").delete().eq("song_id", songId);
						if (deleteResult.error) {
							throw new DatabaseError({
								message: deleteResult.error.message ?? "Failed to clear existing song tags",
							});
						}
						if (validSlugs.length > ZERO) {
							const songTagInsertResult = await supabase
								.from("song_tag")
								.insert(validSlugs.map((slug) => ({ song_id: songId, tag_slug: slug })));
							if (songTagInsertResult.error) {
								throw new DatabaseError({
									message: songTagInsertResult.error.message ?? "Failed to insert song tags",
								});
							}
							const tagLibraryUpsertResult = await supabase.from("tag_library").upsert(
								validSlugs.map((slug) => ({ user_id: userId, tag_slug: slug })),
								{ onConflict: "user_id,tag_slug", ignoreDuplicates: true },
							);
							if (tagLibraryUpsertResult.error) {
								throw new DatabaseError({
									message: tagLibraryUpsertResult.error.message ?? "Failed to update tag library",
								});
							}
						}
					},
					catch: (err) =>
						err instanceof DatabaseError
							? err
							: new DatabaseError({
									message: extractErrorMessage(err, "Failed to save tags"),
								}),
				}),
			);
		}

		// Only add to library if this is a new song (updates don't need this)
		if (!isUpdate) {
			yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("song_library").insert([
							{
								user_id: userId,
								song_id: songId,
							},
						]),
					catch: (err) => {
						// Log error but don't fail the song creation
						console.warn(
							`Failed to add song to library (non-fatal): ${extractErrorMessage(err, "Unknown error")}`,
						);
						return new DatabaseError({
							message: `Song created but failed to add to library: ${extractErrorMessage(err, "Unknown error")}`,
						});
					},
				}),
			);
		}

		// Return updated/created public record (frontend subscriptions will pick up the record as well)
		return publicResult.data;
	});
}
