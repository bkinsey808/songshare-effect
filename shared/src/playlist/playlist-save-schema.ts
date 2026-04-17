import { Schema } from "effect";

/**
 * Schema validating the playlist save API payload (`POST /api/playlists/save`).
 *
 * Kept in `shared/` so clients (e2e helpers, future SDK code) can reference
 * the same type without importing from the API layer.
 */
export const PlaylistSaveSchema = Schema.Struct({
	playlist_id: Schema.optional(Schema.String),
	playlist_name: Schema.String,
	playlist_slug: Schema.String,
	public_notes: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
	song_order: Schema.Array(Schema.String),
	tags: Schema.optional(Schema.Array(Schema.String)),
});

/** Payload type for the playlist save API endpoint. */
export type PlaylistSavePayload = Schema.Schema.Type<typeof PlaylistSaveSchema>;
