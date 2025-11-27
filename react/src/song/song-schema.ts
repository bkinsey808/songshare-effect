// src/features/song/schema.ts
import { Schema } from "effect";

// Define our own message key for song validation
export const songMessageKey: unique symbol = Symbol.for(
	"@songshare/song-message-key",
);

export const songFields = ["lyrics", "script", "enTranslation"] as const;

export const songFieldSchema: Schema.Literal<typeof songFields> =
	Schema.Literal(...songFields);
export const songFieldsSchema: Schema.Array$<
	Schema.Literal<typeof songFields>
> = Schema.Array(songFieldSchema);

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

export const songNameSchema: Schema.Schema<string> = Schema.String.pipe(
	Schema.filter((value) => value.trim() === value, {
		message: () => "song.validation.noLeadingTrailingSpaces",
	}),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.noLeadingTrailingSpaces" },
	}),
	Schema.filter(
		(value) =>
			value.length >= NAME_MIN_LENGTH && value.length <= NAME_MAX_LENGTH,
		{
			message: () => "song.validation.nameLength",
		},
	),
	Schema.annotations({
		[songMessageKey]: {
			key: "song.validation.nameLength",
			minLength: NAME_MIN_LENGTH,
			maxLength: NAME_MAX_LENGTH,
		},
	}),
	Schema.filter((value) => !/\s{2}/.test(value), {
		message: () => "song.validation.noConsecutiveSpaces",
	}),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.noConsecutiveSpaces" },
	}),
);

export const songSlugSchema: Schema.Schema<string> = Schema.String.pipe(
	Schema.filter(
		(value) => {
			// only lowercase letters, numbers, and dashes
			if (!/^[a-z0-9-]+$/.test(value)) {
				return false;
			}

			// cannot start or end with dash
			if (value.startsWith("-") || value.endsWith("-")) {
				return false;
			}

			// no consecutive dashes
			if (value.includes("--")) {
				return false;
			}

			return true;
		},
		{
			message: () => "song.validation.invalidSlugFormat",
		},
	),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.invalidSlugFormat" },
	}),
);

export const slidesOrderSchema: Schema.Array$<typeof Schema.String> =
	Schema.Array(Schema.String);

// Define slide structure first
export const slideSchema: Schema.Struct<{
	slide_name: typeof Schema.String;
	field_data: Schema.Record$<
		Schema.Literal<typeof songFields>,
		typeof Schema.String
	>;
}> = Schema.Struct({
	slide_name: Schema.String,
	field_data: Schema.Record({
		key: songFieldSchema,
		value: Schema.String,
	}),
});

export const slidesSchema: Schema.Record$<
	typeof Schema.String,
	typeof slideSchema
> = Schema.Record({
	key: Schema.String,
	value: slideSchema,
});

export type Slide = Schema.Schema.Type<typeof slideSchema>;

const baseSongPublicSchema: Schema.Struct<{
	song_id: typeof Schema.String;
	song_name: typeof songNameSchema;
	song_slug: typeof songSlugSchema;
	fields: typeof songFieldsSchema;
	slide_order: typeof slidesOrderSchema;
	slides: typeof slidesSchema;
	key: typeof Schema.String;
	scale: typeof Schema.String;
	user_id: typeof Schema.String;
	short_credit: typeof Schema.String;
	long_credit: typeof Schema.String;
	public_notes: typeof Schema.String;
	created_at: typeof Schema.String;
	updated_at: typeof Schema.String;
}> = Schema.Struct({
	song_id: Schema.String,
	song_name: songNameSchema,
	song_slug: songSlugSchema,
	fields: songFieldsSchema,
	slide_order: slidesOrderSchema,
	slides: slidesSchema,
	key: Schema.String,
	scale: Schema.String,
	user_id: Schema.String,
	short_credit: Schema.String,
	long_credit: Schema.String,
	public_notes: Schema.String,
	created_at: Schema.String,
	updated_at: Schema.String,
});

export const songPublicSchema: Schema.Schema<
	Schema.Schema.Type<typeof baseSongPublicSchema>
> = baseSongPublicSchema.pipe(
	// Rule 1: all slide keys must be included in slideOrder
	Schema.filter(
		(input: Schema.Schema.Type<typeof baseSongPublicSchema>) => {
			const slideKeys = Object.keys(input.slides);
			return slideKeys.every((key) => Boolean(input.slide_order.includes(key)));
		},
		{
			message: () => "song.validation.slideKeysInOrder",
		},
	),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.slideKeysInOrder" },
	}),

	// Rule 2: all field_data keys must exist in fields
	Schema.filter(
		(input: Schema.Schema.Type<typeof baseSongPublicSchema>) => {
			// Normalize allowed field names to `string` so we can safely
			// compare against dynamic object keys without unsafe assertions.
			const allowedFields = new Set<string>(input.fields.map(String));
			return Object.values(input.slides).every(
				(slide: Schema.Schema.Type<typeof slideSchema>) =>
					Object.keys(slide.field_data).every((field) =>
						allowedFields.has(field),
					),
			);
		},
		{
			message: () => "song.validation.fieldDataInFields",
		},
	),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.fieldDataInFields" },
	}),
);
export type SongPublic = Schema.Schema.Type<typeof songPublicSchema>;

export const songSchema: Schema.Struct<{
	song_id: typeof Schema.String;
	private_notes: Schema.optional<typeof Schema.String>;
	created_at: typeof Schema.String;
	updated_at: typeof Schema.String;
}> = Schema.Struct({
	song_id: Schema.String,
	private_notes: Schema.optional(Schema.String),
	created_at: Schema.String,
	updated_at: Schema.String,
});

export type Song = Schema.Schema.Type<typeof songSchema>;
