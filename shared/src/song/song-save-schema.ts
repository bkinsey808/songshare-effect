import { Schema } from "effect";

import { SongPublicInsertSchema } from "@/shared/generated/supabaseSchemas";

/**
 * Schema validating the song save API payload (`POST /api/songs/save`).
 *
 * Mirrors the server-side validation in `api/src/song/songSave.ts` and is
 * kept in `shared/` so that clients (e2e helpers, future SDK code) can
 * reference the same type without importing from the API layer.
 */
export const SongSaveSchema = Schema.Struct({
	song_id: Schema.optional(Schema.String),
	song_name: Schema.String,
	song_slug: Schema.String,
	lyrics: Schema.optional(Schema.String),
	script: Schema.optional(Schema.NonEmptyString),
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

/** Payload type for the song save API endpoint. */
export type SongSavePayload = Schema.Schema.Type<typeof SongSaveSchema>;
