/**
 * Converts a song name into a URL-friendly slug
 * Lowercases, replaces spaces with dashes, removes non-alphanumeric characters (except dashes)
 * @param name The song name to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-/, "")
		.replace(/-$/, "");
}
