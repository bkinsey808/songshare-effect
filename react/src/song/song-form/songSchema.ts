// src/features/song-form/schema.ts
import { Schema } from "effect";

const SongFormField = {
	song_id: "song_id",
	song_name: "song_name",
	song_slug: "song_slug",
	short_credit: "short_credit",
	long_credit: "long_credit",
	private_notes: "private_notes",
	public_notes: "public_notes",
	fields: "fields",
	slide_order: "slide_order",
	slides: "slides",
} as const;

export const songFormFields = Object.keys(
	SongFormField,
) as (keyof typeof SongFormField)[];

export const songFormFieldSchema: unknown = Schema.Literal(
	"song_id",
	"song_name",
	"song_slug",
	"short_credit",
	"long_credit",
	"private_notes",
	"public_notes",
	"fields",
	"slide_order",
	"slides",
);

// Define the slide schema locally
export const slideSchema: unknown = Schema.Struct({
	slide_name: Schema.String,
	field_data: Schema.Record({
		key: Schema.String,
		value: Schema.String,
	}),
});

export const slidesSchema: unknown = Schema.Record({
	key: Schema.String,
	value: slideSchema as Schema.Schema<unknown>,
});

export const songFormSchema: unknown = Schema.Struct({
	[SongFormField.song_id]: Schema.optional(Schema.String),
	[SongFormField.song_name]: Schema.String,
	[SongFormField.song_slug]: Schema.String,
	[SongFormField.short_credit]: Schema.optional(Schema.String),
	[SongFormField.long_credit]: Schema.optional(Schema.String),
	[SongFormField.private_notes]: Schema.optional(Schema.String),
	[SongFormField.public_notes]: Schema.optional(Schema.String),
	[SongFormField.fields]: Schema.Array(Schema.String),
	[SongFormField.slide_order]: Schema.Array(Schema.String),
	[SongFormField.slides]: slidesSchema as Schema.Schema<unknown>,
});

export type SongFormValues = Schema.Schema.Type<typeof songFormSchema>;
