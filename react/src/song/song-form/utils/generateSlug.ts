/**
 * Converts a song name into a URL-friendly slug
 * Lowercases, replaces spaces with dashes, removes non-alphanumeric characters (except dashes)
 * @param name The song name to convert to a slug
 * @returns A URL-friendly slug
 */
export default function generateSlug(name: string): string {
	const lower = name.toLowerCase();

	// Keep only a-z, 0-9, whitespace and dashes
	const buf: string[] = [];
	for (const char of lower) {
		if (/[a-z0-9\s-]/.test(char)) {
			buf.push(char);
		}
	}
	const allowed = buf.join("");

	// Turn runs of whitespace into a single dash
	const whitespaceCollapsed = allowed.split(/\s+/).filter(Boolean).join("-");

	// Collapse runs of dashes and trim leading/trailing dashes
	const collapsedDashes = whitespaceCollapsed.split("-").filter(Boolean).join("-");

	return collapsedDashes;
}
