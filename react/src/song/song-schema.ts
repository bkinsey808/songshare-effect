import { Schema } from "effect";
/* oxlint-disable import/exports-last, unicorn/no-array-method-this-argument */

import deriveSongFieldKeys from "@/shared/song/deriveSongFieldKeys";
import { songKeys, type SongKey } from "@/shared/song/songKeyOptions";

/** Minimum allowed characters for a song name (inclusive). */
const NAME_MIN_LENGTH = 2;

/** Maximum allowed characters for a song name (inclusive). */
const NAME_MAX_LENGTH = 100;

/**
 * Symbol used as a key in Schema.annotations to attach i18n message metadata.
 * Validators reference i18n keys like `song.validation.*` using this symbol.
 */
export const songMessageKey: unique symbol = Symbol.for("@songshare/song-message-key");

/**
 * Regex for a simplified BCP 47 language tag.
 *
 * Covers the full range of codes used in `translation-languages.json`:
 *   - 2- or 3-letter language subtag:  "en", "grc", "pli"
 *   - Optional script subtag:          "zh-Hans", "sa-Latn"
 *   - Optional region subtag:          "pt-BR"
 *   - Combinations:                    "zh-Hant-TW"
 */
const BCP47_REGEX = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;

/**
 * Schema for a BCP 47 language code.
 * Used for `lyrics` and each element of `translations`.
 */
export const languageCodeSchema: Schema.Schema<string> = Schema.String.pipe(
	Schema.filter((value) => BCP47_REGEX.test(value), {
		message: () => "song.validation.invalidLanguageCode",
	}),
	Schema.annotations({ [songMessageKey]: { key: "song.validation.invalidLanguageCode" } }),
);

/** Schema for the translations array — each element must be a valid BCP 47 code. */
export const translationsSchema: Schema.Array$<typeof languageCodeSchema> =
	Schema.Array(languageCodeSchema);

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
 * `slide_name` is a string and `field_data` is a generic string record.
 * Cross-field validation that constrains those keys to the song's declared
 * language columns happens at the `songPublicSchema` level.
 */
export const slideSchema: Schema.Struct<{
	slide_name: typeof Schema.String;
	field_data: Schema.Record$<typeof Schema.String, typeof Schema.String>;
	background_image_id: Schema.optional<typeof Schema.String>;
	background_image_url: Schema.optional<typeof Schema.String>;
	background_image_width: Schema.optional<typeof Schema.Number>;
	background_image_height: Schema.optional<typeof Schema.Number>;
	background_image_focal_point_x: Schema.optional<typeof Schema.Number>;
	background_image_focal_point_y: Schema.optional<typeof Schema.Number>;
}> = Schema.Struct({
	slide_name: Schema.String,
	field_data: Schema.Record({ key: Schema.String, value: Schema.String }),
	background_image_id: Schema.optional(Schema.String),
	background_image_url: Schema.optional(Schema.String),
	background_image_width: Schema.optional(Schema.Number),
	background_image_height: Schema.optional(Schema.Number),
	background_image_focal_point_x: Schema.optional(Schema.Number),
	background_image_focal_point_y: Schema.optional(Schema.Number),
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
const nullableSongKeySchema: Schema.Schema<SongKey | null> = Schema.Union(
	Schema.Literal(...songKeys),
	Schema.Null,
);

/**
 * Base schema for a public song payload from the DB.
 * Contains validated sub-schemas for `song_name`, `song_slug`, `slides`, and other fields.
 * Nullable DB columns are represented using `nullableStringSchema`.
 *
 * Language fields:
 *   - `lyrics`       — BCP 47 code for the song's original language (e.g. "sa", "en")
 *   - `script`       — optional BCP 47 code for presenter notes (e.g. "en")
 *   - `translations` — ordered array of additional BCP 47 codes (e.g. ["sa-Latn", "es"])
 *
 * The three language roles are mutually exclusive. Together
 * `{lyrics} ∪ {script} ∪ translations` defines the complete set of keys that
 * may appear in each slide's `field_data`. Cross-field constraints are enforced
 * in `songPublicSchema`.
 */
const baseSongPublicSchema: Schema.Struct<{
	song_id: typeof Schema.String;
	song_name: typeof songNameSchema;
	song_slug: typeof songSlugSchema;
	lyrics: typeof languageCodeSchema;
	script: Schema.optional<typeof languageCodeSchema>;
	translations: typeof translationsSchema;
	slide_order: typeof slidesOrderSchema;
	slides: typeof slidesSchema;
	key: typeof nullableSongKeySchema;
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
	lyrics: languageCodeSchema,
	script: Schema.optional(languageCodeSchema),
	translations: translationsSchema,
	slide_order: slidesOrderSchema,
	slides: slidesSchema,
	key: nullableSongKeySchema,
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
 * - Rule 2: `lyrics` must not appear in `translations`
 * - Rule 3: `script` must differ from `lyrics` and not appear in `translations`
 * - Rule 4: `translations` must contain no duplicate language codes
 * - Rule 5: every slide's `field_data` keys must exactly match `{lyrics} ∪ {script} ∪ translations`
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

		// Rule 2: lyrics code must not appear in translations
		// oxlint-disable-next-line unicorn/no-array-method-this-argument
		Schema.filter(
			(input: Schema.Schema.Type<typeof baseSongPublicSchema>) =>
				!input.translations.includes(input.lyrics),
			{
				message: () => "song.validation.lyricsNotInTranslations",
			},
		),
		Schema.annotations({
			[songMessageKey]: { key: "song.validation.lyricsNotInTranslations" },
		}),

		// Rule 3: script must differ from lyrics and not appear in translations
		// oxlint-disable-next-line unicorn/no-array-method-this-argument
		Schema.filter(
			(input: Schema.Schema.Type<typeof baseSongPublicSchema>) => {
				if (input.script === undefined) {
					return true;
				}

				return input.script !== input.lyrics && !input.translations.includes(input.script);
			},
			{
				message: () => "song.validation.scriptMustBeDisjoint",
			},
		),
		Schema.annotations({
			[songMessageKey]: { key: "song.validation.scriptMustBeDisjoint" },
		}),

		// Rule 4: translations must contain no duplicate language codes
		// oxlint-disable-next-line unicorn/no-array-method-this-argument
		Schema.filter(
			(input: Schema.Schema.Type<typeof baseSongPublicSchema>) =>
				new Set(input.translations).size === input.translations.length,
			{
				message: () => "song.validation.translationsNoDuplicates",
			},
		),
		Schema.annotations({
			[songMessageKey]: { key: "song.validation.translationsNoDuplicates" },
		}),

		// Rule 5: every slide's field_data keys must exactly match the declared language fields
		// oxlint-disable-next-line unicorn/no-array-method-this-argument
		Schema.filter(
			(input: Schema.Schema.Type<typeof baseSongPublicSchema>) => {
				const allowedFieldKeys = deriveSongFieldKeys({
					lyrics: input.lyrics,
					script: input.script,
					translations: input.translations,
				});
				const allowedFieldKeySet = new Set(allowedFieldKeys);

				return Object.values(input.slides).every((slide) => {
					const slideFieldKeys = Object.keys(slide.field_data);
					return (
						slideFieldKeys.length === allowedFieldKeys.length &&
						slideFieldKeys.every((fieldKey) => allowedFieldKeySet.has(fieldKey))
					);
				});
			},
			{
				message: () => "song.validation.fieldDataKeysMatchLanguages",
			},
		),
		Schema.annotations({
			[songMessageKey]: { key: "song.validation.fieldDataKeysMatchLanguages" },
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
