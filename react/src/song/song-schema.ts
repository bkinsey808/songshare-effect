import { Schema } from "effect";
/* oxlint-disable import/exports-last, unicorn/no-array-method-this-argument */

/** Minimum allowed characters for a song name (inclusive). */
const NAME_MIN_LENGTH = 2;

/** Maximum allowed characters for a song name (inclusive). */
const NAME_MAX_LENGTH = 100;

/**
 * Symbol used as a key in Schema.annotations to attach i18n message metadata.
 * Validators reference i18n keys like `song.validation.*` using this symbol.
 */
export const songMessageKey: unique symbol = Symbol.for("@songshare/song-message-key");

/** Allowed field names for slide `field_data`. Kept explicit for validation and typing. */
export const songFields = ["lyrics", "script", "enTranslation"] as const;

export const songFieldSchema: Schema.Literal<typeof songFields> = Schema.Literal(...songFields);
export const songFieldsSchema: Schema.Array$<Schema.Literal<typeof songFields>> =
	Schema.Array(songFieldSchema);

/**
 * Schema for song names:
 * - No leading/trailing spaces
 * - Length between NAME_MIN_LENGTH and NAME_MAX_LENGTH
 * - No consecutive spaces
 *
 * Attaches i18n message keys via `songMessageKey` for each rule.
 */
export const songNameSchema: Schema.Schema<string> = Schema.String.pipe(
	// oxlint-disable-next-line unicorn/no-array-method-this-argument
	Schema.filter((value) => value.trim() === value, {
		message: () => "song.validation.noLeadingTrailingSpaces",
	}),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.noLeadingTrailingSpaces" },
	}),
	// oxlint-disable-next-line unicorn/no-array-method-this-argument
	Schema.filter((value) => value.length >= NAME_MIN_LENGTH && value.length <= NAME_MAX_LENGTH, {
		message: () => "song.validation.nameLength",
	}),
	Schema.annotations({
		[songMessageKey]: {
			key: "song.validation.nameLength",
			minLength: NAME_MIN_LENGTH,
			maxLength: NAME_MAX_LENGTH,
		},
	}),
	// oxlint-disable-next-line unicorn/no-array-method-this-argument
	Schema.filter((value) => !/\s{2}/.test(value), {
		message: () => "song.validation.noConsecutiveSpaces",
	}),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.noConsecutiveSpaces" },
	}),
);

/**
 * Slug validator used for `song_slug`:
 * - Only lowercase letters, numbers and dashes
 * - Must not start or end with a dash
 * - No consecutive dashes
 */
export const songSlugSchema: Schema.Schema<string> = Schema.String.pipe(
	// oxlint-disable-next-line unicorn/no-array-method-this-argument
	Schema.filter(
		(value) => {
			if (!/^[a-z0-9-]+$/.test(value)) {
				return false;
			} // only lowercase letters, numbers and dashes
			if (value.startsWith("-") || value.endsWith("-")) {
				return false;
			} // cannot start/end with dash
			if (value.includes("--")) {
				return false;
			} // no consecutive dashes
			return true;
		},
		{ message: () => "song.validation.invalidSlugFormat" },
	),
	Schema.annotations({
		[songMessageKey]: { key: "song.validation.invalidSlugFormat" },
	}),
);

export const slidesOrderSchema: Schema.Array$<typeof Schema.String> = Schema.Array(Schema.String);

/**
 * Schema for an individual slide.
 *
 * `slide_name` is a string and `field_data` is a record keyed by string to string.
 * We use `Schema.String` for keys instead of Literal because:
 *   - runtime data may have keys that don't match literal types exactly
 *   - Rule validations (see `songPublicSchema`) ensure keys belong to `fields`
 * This keeps the schema flexible while preserving type safety.
 */
export const slideSchema: Schema.Struct<{
	slide_name: typeof Schema.String;
	field_data: Schema.Record$<typeof Schema.String, typeof Schema.String>;
}> = Schema.Struct({
	slide_name: Schema.String,
	field_data: Schema.Record({ key: Schema.String, value: Schema.String }),
});

/** Map of slide keys to slide objects for a song. */
export const slidesSchema: Schema.Record$<typeof Schema.String, typeof slideSchema> = Schema.Record(
	{ key: Schema.String, value: slideSchema },
);

/** Validated Slide object type inferred from `slideSchema`. */
export type Slide = Schema.Schema.Type<typeof slideSchema>;

/**
 * Accepts `string` or `null`. Used for DB nullable string columns that are optional.
 */
const nullableStringSchema: Schema.Schema<string | null> = Schema.Union(Schema.String, Schema.Null);

/**
 * Base schema for a public song payload from the DB.
 * Contains validated sub-schemas for `song_name`, `song_slug`, `slides`, and other fields.
 * Nullable DB columns are represented using `nullableStringSchema`.
 */
const baseSongPublicSchema: Schema.Struct<{
	song_id: typeof Schema.String;
	song_name: typeof songNameSchema;
	song_slug: typeof songSlugSchema;
	fields: typeof songFieldsSchema;
	slide_order: typeof slidesOrderSchema;
	slides: typeof slidesSchema;
	key: typeof nullableStringSchema;
	scale: typeof nullableStringSchema;
	user_id: typeof Schema.String;
	short_credit: typeof nullableStringSchema;
	long_credit: typeof nullableStringSchema;
	public_notes: typeof nullableStringSchema;
	created_at: typeof Schema.String;
	updated_at: typeof Schema.String;
}> = Schema.Struct({
	song_id: Schema.String,
	song_name: songNameSchema,
	song_slug: songSlugSchema,
	fields: songFieldsSchema,
	slide_order: slidesOrderSchema,
	slides: slidesSchema,
	key: nullableStringSchema,
	scale: nullableStringSchema,
	user_id: Schema.String,
	short_credit: nullableStringSchema,
	long_credit: nullableStringSchema,
	public_notes: nullableStringSchema,
	created_at: Schema.String,
	updated_at: Schema.String,
});

/**
 * Public-facing song schema with cross-field validations:
 * - Rule 1: every slide key in `slides` must appear in `slide_order`
 * - Rule 2: every key in a slide's `field_data` must exist in `fields`
 *
 * Each rule attaches an i18n message via `songMessageKey` for user-friendly errors.
 */
export const songPublicSchema: Schema.Schema<Schema.Schema.Type<typeof baseSongPublicSchema>> =
	baseSongPublicSchema.pipe(
		// Rule 1: all slide keys must be included in slideOrder
		// oxlint-disable-next-line unicorn/no-array-method-this-argument
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
		// oxlint-disable-next-line unicorn/no-array-method-this-argument
		Schema.filter(
			(input: Schema.Schema.Type<typeof baseSongPublicSchema>) => {
				// Normalize allowed field names to `string` so we can safely
				// compare against dynamic object keys without unsafe assertions.
				const allowedFields = new Set<string>(input.fields.map(String));
				return Object.values(input.slides).every((slide: Schema.Schema.Type<typeof slideSchema>) =>
					Object.keys(slide.field_data).every((field) => allowedFields.has(field)),
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

/** Type for validated public song payloads. */
export type SongPublic = Schema.Schema.Type<typeof songPublicSchema>;

/**
 * Internal song record schema. Contains fields stored in a private table such as `private_notes`.
 */
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

/** Type for validated internal (private) song records. */
export type Song = Schema.Schema.Type<typeof songSchema>;
