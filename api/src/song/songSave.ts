import { Effect, Schema } from "effect";

import { getErrorMessage } from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { type Database, type Json } from "@/shared/generated/supabaseTypes";
import { isRecord, isString } from "@/shared/utils/typeGuards";
import { validateFormEffect } from "@/shared/validation/validateFormEffect";
import { createClient } from "@supabase/supabase-js";

import {
	type AuthenticationError,
	DatabaseError,
	ValidationError,
} from "../errors";
import { getVerifiedUserSession } from "../user-session/getVerifiedSession";

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

// Extract the type from the schema
type SongFormData = Schema.Schema.Type<typeof SongFormSchema>;

/**
 * Effect-based handler used by handleHttpEndpoint. Returns the created public song data.
 */
export function songSave(
	ctx: ReadonlyContext,
): Effect.Effect<
	unknown,
	ValidationError | DatabaseError | AuthenticationError
> {
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
					// Pick first error to return a structured ValidationError
					// Use `find` to obtain the first entry without using a numeric literal
					const first =
						Array.isArray(errs) && errs.length
							? errs.find(() => true)
							: undefined;
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

		// Build strongly-typed values for DB insertion to avoid unsafe assertions.
		// Use runtime checks and safe coercions so ESLint/TS won't require `as` casts.
		const fieldsForDb: string[] = Array.isArray(validated.fields)
			? validated.fields.map((fieldVal) => String(fieldVal))
			: [];
		const slideOrderForDb: string[] = Array.isArray(validated.slide_order)
			? validated.slide_order.map((slideVal) => String(slideVal))
			: [];
		let slidesForDb: Json = {};

		// Sanitize slides into a JSON-serializable structure using runtime
		// guards. This avoids unsafe 'as' assertions and ensures only plain
		// objects + strings are persisted.
		if (isRecord(validated.slides)) {
			const sanitized: Record<
				string,
				{ slide_name: string; field_data: Record<string, string> }
			> = {};

			for (const [slideKey, slideVal] of Object.entries(validated.slides)) {
				if (!isRecord(slideVal)) {
					// skip invalid slide entries
				} else {
					const slideNameRaw = slideVal["slide_name"];
					const slideName = isString(slideNameRaw) ? slideNameRaw : "";

					const fieldDataRaw = slideVal["field_data"];
					const fieldData: Record<string, string> = {};

					if (isRecord(fieldDataRaw)) {
						for (const [fk, fv] of Object.entries(fieldDataRaw)) {
							fieldData[String(fk)] = isString(fv) ? fv : "";
						}
					}

					sanitized[String(slideKey)] = {
						slide_name: slideName,
						field_data: fieldData,
					};
				}
			}

			slidesForDb = sanitized;
		} else {
			slidesForDb = {};
		}

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
				try: async () =>
					supabase
						.from("song")
						.insert([
							{
								song_id: songId,
								user_id: userId,
								private_notes: validated.private_notes ?? "",
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
				try: async () =>
					supabase
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
								short_credit: validated.short_credit ?? null,
								long_credit: validated.long_credit ?? null,
								public_notes: validated.public_notes ?? null,
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
						try: async () =>
							supabase.from("song").delete().eq("song_id", songId),
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
