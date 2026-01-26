import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { type Database, type Json } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import sanitizeSlidesForDb from "./sanitizeSlidesForDb";

/**
 * Server-side schema (keeps verification close to the API boundary)
 */
const SongFormSchema = Schema.Struct({
	song_id: Schema.optional(Schema.String),
	song_name: Schema.String,
	song_slug: Schema.String,
	short_credit: Schema.optional(Schema.String),
	long_credit: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
	public_notes: Schema.optional(Schema.String),
	fields: Schema.Array(Schema.String),
	slide_order: Schema.Array(Schema.String),
	slides: Schema.Record({
		key: Schema.String,
		value: Schema.Struct({
			slide_name: Schema.String,
			field_data: Schema.Record({
				key: Schema.String,
				value: Schema.String,
			}),
		}),
	}),
});

// Avoid using magic numbers like `0` in multiple places — prefer a named
// constant for clarity and to satisfy the project's lint rules.
const ZERO = 0;

// Extract the type from the schema

type SongFormData = Schema.Schema.Type<typeof SongFormSchema>;

/**
 * Sanitize an incoming `slides` value into a JSON-serializable structure
 * suitable for writing into the `song_public.slides` column. This strips
 * out non-record entries and coerces values to plain strings where needed.
 *
 * This is intentionally a runtime guard that accepts `unknown` and returns
 * a safe plain-object `Json` value; it does not perform schema validation.
 *
 * @param slides - The raw `slides` value from the incoming payload.
 * @returns A plain JSON object that is safe to persist in the DB.
 */

/**
 * Effect-based handler used by handleHttpEndpoint. Returns the created public song data.
 */
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
				Effect.mapError((errs) => {
					// Pick first error to return a structured ValidationError.
					// Use a named ZERO constant instead of a magic numeric literal.
					const first =
						Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

		// Build strongly-typed values for DB insertion to avoid unsafe assertions.
		// Use runtime checks and safe coercions so ESLint/TS won't require `as` casts.
		const fieldsForDb: string[] = Array.isArray(validated.fields)
			? validated.fields.map(String)
			: [];
		const slideOrderForDb: string[] = Array.isArray(validated.slide_order)
			? validated.slide_order.map(String)
			: [];
		// CRITICAL: Pass fields array to sanitizeSlidesForDb so it can normalize field_data
		// to ensure all fields are present in every slide's field_data
		const slidesForDb: Json = sanitizeSlidesForDb(validated.slides, validated.fields);

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
							message: `Failed to verify song ownership: ${getErrorMessage(err)}`,
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
						message: `Failed to ${isUpdate ? "update" : "create"} private song: ${getErrorMessage(err)}`,
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
								fields: fieldsForDb,
								slide_order: slideOrderForDb,
								slides: slidesForDb,
								/* eslint-disable-next-line unicorn/no-null */
								short_credit: validated.short_credit ?? null,
								/* eslint-disable-next-line unicorn/no-null */
								long_credit: validated.long_credit ?? null,
								/* eslint-disable-next-line unicorn/no-null */
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
								fields: fieldsForDb,
								slide_order: slideOrderForDb,
								slides: slidesForDb,
								/* eslint-disable-next-line unicorn/no-null */
								short_credit: validated.short_credit ?? null,
								/* eslint-disable-next-line unicorn/no-null */
								long_credit: validated.long_credit ?? null,
								/* eslint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes ?? null,
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} public song: ${getErrorMessage(err)}`,
					}),
			}),
		);

		if (publicResult.error) {
			// Only attempt cleanup if this was a create operation
			if (!isUpdate) {
				try {
					void Effect.runPromise(
						Effect.tryPromise({
							try: () => supabase.from("song").delete().eq("song_id", songId),
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

		// Only add to library if this is a new song (updates don't need this)
		if (!isUpdate) {
			yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("song_library").insert([
							{
								user_id: userId,
								song_id: songId,
								song_owner_id: userId,
							},
						]),
					catch: (err) => {
						// Log error but don't fail the song creation
						console.warn(`Failed to add song to library (non-fatal): ${getErrorMessage(err)}`);
						return new DatabaseError({
							message: `Song created but failed to add to library: ${getErrorMessage(err)}`,
						});
					},
				}),
			);
		}

		// Return updated/created public record (frontend subscriptions will pick up the record as well)
		return publicResult.data;
	});
}

// Provide a named export in addition to the default - some callers import { songSave }
// rather than the default export. Exporting the local symbol keeps the file small
// and avoids requiring callers to change their imports.
export { songSave };
