import { Schema } from "effect";

const MIN_EVENT_NAME_LENGTH = 2;
const MAX_EVENT_NAME_LENGTH = 100;

/**
 * Event form schema for client-side validation
 */
const eventFormSchema = Schema.Struct({
	event_id: Schema.optional(Schema.String),
	event_name: Schema.String.pipe(
		Schema.minLength(MIN_EVENT_NAME_LENGTH),
		Schema.maxLength(MAX_EVENT_NAME_LENGTH),
	),
	event_slug: Schema.String.pipe(
		Schema.pattern(/^[a-z0-9-]+$/, {
			message: () => "Slug must contain only lowercase letters, numbers, and hyphens",
		}),
	),
	event_description: Schema.optional(Schema.String),
	event_date: Schema.optional(Schema.String),
	is_public: Schema.optional(Schema.Boolean),
	active_playlist_id: Schema.optional(Schema.NullishOr(Schema.String)),
	active_song_id: Schema.optional(Schema.NullishOr(Schema.String)),
	active_slide_position: Schema.optional(Schema.NullishOr(Schema.Number)),
	public_notes: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
});

export default eventFormSchema;
