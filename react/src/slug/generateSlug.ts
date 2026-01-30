/**
 * Converts a song name into a URL-friendly slug
 * Lowercases, converts underscores to spaces (so they become dashes), replaces spaces with dashes,
 * removes non-alphanumeric characters (except dashes), and collapses multiple separators.
 * @param name The song name to convert to a slug
 * @returns A URL-friendly slug
 */
export default function generateSlug(name: string): string {
	// Normalize and convert underscores to spaces so they become dashes after collapsing
	const normalized = name.toLowerCase().replaceAll("_", " ");

	// Keep only a-z, 0-9, whitespace and dashes
	const buf: string[] = [];
	for (const char of normalized) {
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
