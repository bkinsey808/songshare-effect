// src/features/song-form/schema.ts
import { Schema } from "effect";

import { SongPublicInsertSchema, type SongPublicInsert } from "@/shared/generated/supabaseSchemas";

const SongFormField = {
	song_id: "song_id",
	song_name: "song_name",
	song_slug: "song_slug",
	key: "key",
	short_credit: "short_credit",
	long_credit: "long_credit",
	private_notes: "private_notes",
	public_notes: "public_notes",
	fields: "fields",
	slide_order: "slide_order",
	tags: "tags",
	slides: "slides",
} as const;

export const songFormFields = [
	"song_id",
	"song_name",
	"song_slug",
	"key",
	"short_credit",
	"long_credit",
	"private_notes",
	"public_notes",
	"fields",
	"slide_order",
	"tags",
	"slides",
] as const;

export type SongFormFieldKey = (typeof songFormFields)[number];

export const songFormFieldSchema: unknown = Schema.Literal(
	"song_id",
	"song_name",
	"song_slug",
	"key",
	"short_credit",
	"long_credit",
	"private_notes",
	"public_notes",
	"fields",
	"slide_order",
	"tags",
	"slides",
);

// Define the slide schema locally
export type SlideShape = {
	slide_name: string;
	field_data: Record<string, string>;
	background_image_id?: string | undefined;
	background_image_url?: string | undefined;
	background_image_width?: number | undefined;
	background_image_height?: number | undefined;
	background_image_focal_point_x?: number | undefined;
	background_image_focal_point_y?: number | undefined;
};

export const slideSchema: Schema.Schema<SlideShape> = Schema.Struct({
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
});

export const slidesSchema: Schema.Schema<Record<string, SlideShape>> = Schema.Record({
	key: Schema.String,
	value: slideSchema,
});

export type SongFormValues = {
	song_id?: string | undefined;
	song_name: string;
	song_slug: string;
	key?: SongPublicInsert["key"];
	short_credit?: string | undefined;
	long_credit?: string | undefined;
	private_notes?: string | undefined;
	public_notes?: string | undefined;
	fields: readonly string[];
	slide_order: readonly string[];
	tags?: readonly string[] | undefined;
	slides: Record<string, SlideShape>;
};

export const songFormSchema: Schema.Schema<SongFormValues> = Schema.Struct({
	[SongFormField.song_id]: Schema.optional(Schema.String),
	[SongFormField.song_name]: Schema.String,
	[SongFormField.song_slug]: Schema.String,
	[SongFormField.key]: SongPublicInsertSchema.fields.key,
	[SongFormField.short_credit]: Schema.optional(Schema.String),
	[SongFormField.long_credit]: Schema.optional(Schema.String),
	[SongFormField.private_notes]: Schema.optional(Schema.String),
	[SongFormField.public_notes]: Schema.optional(Schema.String),
	[SongFormField.fields]: Schema.Array(Schema.String),
	[SongFormField.slide_order]: Schema.Array(Schema.String),
	[SongFormField.tags]: Schema.optional(Schema.Array(Schema.String)),
	[SongFormField.slides]: slidesSchema,
});

export type SongFormValuesFromSchema = Schema.Schema.Type<typeof songFormSchema>;
