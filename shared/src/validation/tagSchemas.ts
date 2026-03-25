import { Schema } from "effect";

const MIN_SLUG_LENGTH = 2;
const MAX_SLUG_LENGTH = 50;

/**
 * Validates a single tag slug: kebab-case, lowercase, 2–50 chars.
 * Must start with a letter; segments of lowercase alphanumerics separated by single hyphens.
 */
export const tagSlugSchema: Schema.Schema<string, string> = Schema.String.pipe(
	Schema.minLength(MIN_SLUG_LENGTH),
	Schema.maxLength(MAX_SLUG_LENGTH),
	Schema.pattern(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, {
		message: () =>
			"Tag must be kebab-case: lowercase letters, digits, and hyphens only (e.g. indie-rock)",
	}),
);

/**
 * The set of item types that can be tagged.
 */
export const tagItemTypeSchema: Schema.Schema<
	"song" | "playlist" | "event" | "community" | "image",
	"song" | "playlist" | "event" | "community" | "image"
> = Schema.Literal("song", "playlist", "event", "community", "image");

/**
 * Schema for adding a tag to an item (POST /api/tags/add-to-item).
 */
export const tagAddToItemSchema: Schema.Schema<
	{
		readonly tag_slug: string;
		readonly item_type: "song" | "playlist" | "event" | "community" | "image";
		readonly item_id: string;
	},
	{
		readonly tag_slug: string;
		readonly item_type: "song" | "playlist" | "event" | "community" | "image";
		readonly item_id: string;
	}
> = Schema.Struct({
	tag_slug: tagSlugSchema,
	item_type: tagItemTypeSchema,
	item_id: Schema.String,
});

/**
 * Schema for removing a tag from an item (DELETE /api/tags/remove-from-item).
 */
export const tagRemoveFromItemSchema: Schema.Schema<
	{
		readonly tag_slug: string;
		readonly item_type: "song" | "playlist" | "event" | "community" | "image";
		readonly item_id: string;
	},
	{
		readonly tag_slug: string;
		readonly item_type: "song" | "playlist" | "event" | "community" | "image";
		readonly item_id: string;
	}
> = Schema.Struct({
	tag_slug: tagSlugSchema,
	item_type: tagItemTypeSchema,
	item_id: Schema.String,
});

/**
 * Schema for adding a tag to the user's tag library (POST /api/tag-library/add).
 */
export const tagLibraryAddSchema: Schema.Schema<
	{ readonly tag_slug: string },
	{ readonly tag_slug: string }
> = Schema.Struct({
	tag_slug: tagSlugSchema,
});

/**
 * Schema for removing a tag from the user's tag library (DELETE /api/tag-library/remove).
 */
export const tagLibraryRemoveSchema: Schema.Schema<
	{ readonly tag_slug: string },
	{ readonly tag_slug: string }
> = Schema.Struct({
	tag_slug: tagSlugSchema,
});
