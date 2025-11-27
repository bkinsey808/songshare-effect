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

export const songFormFields = [
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
] as const;

export type SongFormFieldKey = (typeof songFormFields)[number];

// Schema.* factory names are constructor-style PascalCase by the effect library
// and intentionally trigger the `new-cap` rule. Disable that rule locally.
// eslint-disable-next-line new-cap
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
export type SlideShape = {
	slide_name: string;
	field_data: Record<string, string>;
};

// eslint-disable-next-line new-cap
export const slideSchema: Schema.Schema<SlideShape> = Schema.Struct({
	slide_name: Schema.String,
	field_data: // eslint-disable-next-line new-cap
		Schema.Record({
			key: Schema.String,
			value: Schema.String,
		}),
});

// eslint-disable-next-line new-cap
export const slidesSchema: Schema.Schema<Record<string, SlideShape>> =
	// eslint-disable-next-line new-cap
	Schema.Record({
		key: Schema.String,
		value: slideSchema,
	});

export type SongFormValues = {
	song_id?: string | undefined;
	song_name: string;
	song_slug: string;
	short_credit?: string | undefined;
	long_credit?: string | undefined;
	private_notes?: string | undefined;
	public_notes?: string | undefined;
	fields: readonly string[];
	slide_order: readonly string[];
	slides: Record<string, SlideShape>;
};

// eslint-disable-next-line new-cap
export const songFormSchema: Schema.Schema<SongFormValues> = Schema.Struct({
	[SongFormField.song_id]: Schema.optional(Schema.String),
	[SongFormField.song_name]: Schema.String,
	[SongFormField.song_slug]: Schema.String,
	[SongFormField.short_credit]: Schema.optional(Schema.String),
	[SongFormField.long_credit]: Schema.optional(Schema.String),
	[SongFormField.private_notes]: Schema.optional(Schema.String),
	[SongFormField.public_notes]: Schema.optional(Schema.String),
	[SongFormField.fields]: Schema.Array(Schema.String),
	[SongFormField.slide_order]: Schema.Array(Schema.String),
	[SongFormField.slides]: slidesSchema,
});

export type SongFormValuesFromSchema = Schema.Schema.Type<
	typeof songFormSchema
>;
