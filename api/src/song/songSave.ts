import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import type { Context } from "hono";

import type { Bindings } from "../env";
import {
	type AuthenticationError,
	DatabaseError,
	ValidationError,
} from "../errors";
import { getVerifiedUserSession } from "../userSession/getVerifiedSession";
import type { Database, Json } from "@/shared/generated/supabaseTypes";
import { validateFormEffect } from "@/shared/validation/validateFormEffect";

// Server-side schema (keeps verification close to the API boundary)
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
	ctx: Context<{ Bindings: Bindings }>,
): Effect.Effect<
	unknown,
	ValidationError | DatabaseError | AuthenticationError
> {
	return Effect.gen(function* ($) {
		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Parse JSON body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: () => ctx.req.json(),
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
					const first =
						Array.isArray(errs) && errs.length > 0 ? errs[0] : undefined;
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

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
								private_notes: validated.private_notes ?? "",
							},
						])
						.select()
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to create private song: ${String(err)}`,
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
								song_name: validated.song_name,
								song_slug: validated.song_slug,
								fields: validated.fields as string[],
								slide_order: validated.slide_order as string[],
								slides: validated.slides as unknown as Json,
								// eslint-disable-next-line unicorn/no-null
								short_credit: validated.short_credit ?? null,
								// eslint-disable-next-line unicorn/no-null
								long_credit: validated.long_credit ?? null,
								// eslint-disable-next-line unicorn/no-null
								public_notes: validated.public_notes ?? null,
							},
						])
						.select()
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to create public song: ${String(err)}`,
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
