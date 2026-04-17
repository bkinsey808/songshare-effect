import { Schema } from "effect";

/**
 * Schema validating the event save API payload (`POST /api/events/save`).
 *
 * Kept in `shared/` so clients (e2e helpers, future SDK code) can reference
 * the same type without importing from the API layer.
 */
export const EventSaveSchema = Schema.Struct({
	event_id: Schema.optional(Schema.String),
	event_name: Schema.optional(Schema.String),
	event_slug: Schema.optional(Schema.String),
	event_description: Schema.optional(Schema.String),
	event_date: Schema.optional(Schema.String),
	is_public: Schema.optional(Schema.Boolean),
	active_playlist_id: Schema.optional(Schema.NullishOr(Schema.String)),
	active_song_id: Schema.optional(Schema.NullishOr(Schema.String)),
	active_slide_position: Schema.optional(Schema.NullishOr(Schema.Number)),
	public_notes: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
	tags: Schema.optional(Schema.Array(Schema.String)),
});

/** Payload type for the event save API endpoint. */
export type EventSavePayload = Schema.Schema.Type<typeof EventSaveSchema>;
