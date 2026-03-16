/** Max character length for the URL slug base before appending the unique suffix. */
const SLUG_BASE_MAX_LENGTH = 50;
/** Start index for string slice operations. */
const SLICE_START = 0;

/**
 * Build a URL-safe slug from a human-readable name.
 *
 * Converts the name to lowercase, replaces spaces and special characters with
 * hyphens, collapses consecutive hyphens, and trims leading/trailing hyphens.
 *
 * @param name - The display name to slugify.
 * @param suffix - A short suffix (e.g. part of UUID) to ensure uniqueness.
 * @returns - A URL-safe slug string.
 */
export default function buildImageSlug(name: string, suffix: string): string {
	const base = name
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, "-")
		.replaceAll(/^-+|-+$/g, "")
		.slice(SLICE_START, SLUG_BASE_MAX_LENGTH);
	return `${base}-${suffix}`;
}
