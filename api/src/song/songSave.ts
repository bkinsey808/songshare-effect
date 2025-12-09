import { Effect } from "effect";
import { createClient } from "@supabase/supabase-js";

import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { type Database, type Json } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import sanitizeSlidesForDb from "./sanitizeSlidesForDb";

import { SongFormSchema, type SongFormData } from "@/shared/song/songFormSchema";

/**
 * Server-side schema (keeps verification close to the API boundary)
 */

// Avoid using magic numbers like `0` in multiple places — prefer a named
// constant for clarity and to satisfy the project's lint rules.
const ZERO = 0;

// Extract the type from the schema

// Reuse shared type exported by shared SongFormSchema module
// (SongFormData imported above)

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
					const first = Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
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
		const slidesForDb: Json = sanitizeSlidesForDb(validated.slides);

		// Create Supabase client with service role key to bypass RLS for writes
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Create a new song id using crypto.randomUUID() to match database UUID type
		const songId = crypto.randomUUID();

		// Insert private song data first
		const privateInsert = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("song")
						.insert([
							{
								song_id: songId,
								user_id: userId,
								private_notes: String(validated.private_notes ?? ""),
							},
						])
						.select()
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to create private song: ${getErrorMessage(err)}`,
					}),
			}),
		);

		if (privateInsert.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: privateInsert.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Insert into public table (song_public) — fields that are safe for sharing
		const publicInsert = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("song_public")
						.insert([
							{
								song_id: songId,
								user_id: userId,
								song_name: String(validated.song_name),
								song_slug: String(validated.song_slug),
								fields: fieldsForDb,
								slide_order: slideOrderForDb,
								slides: slidesForDb,
								/* eslint-disable-next-line unicorn/no-null */
								short_credit: validated.short_credit === undefined ? null : String(validated.short_credit),
								/* eslint-disable-next-line unicorn/no-null */
								long_credit: validated.long_credit === undefined ? null : String(validated.long_credit),
								/* eslint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes === undefined ? null : String(validated.public_notes),
							},
						])
						.select()
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to create public song: ${getErrorMessage(err)}`,
					}),
			}),
		);

		if (publicInsert.error) {
			// Attempt cleanup of private insert
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
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: publicInsert.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Return created public record (frontend subscriptions will pick up the record as well)
		return publicInsert.data;
	});
}

// Provide a named export in addition to the default - some callers import { songSave }
// rather than the default export. Exporting the local symbol keeps the file small
// and avoids requiring callers to change their imports.
export { songSave };
