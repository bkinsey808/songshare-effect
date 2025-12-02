// Trim and remove trailing slashes from an origin string to normalize comparisons.
export default function normalizeOrigin(raw: string): string {
	// Remove leading/trailing whitespace then collapse any trailing slashes.
	// Using a regex avoids numeric literals (no-magic-numbers) and is concise.
	const trimmed = raw.trim();
	// remove one or more trailing slashes; e.g. 'https://site.com///' -> 'https://site.com'
	return trimmed.replace(/\/+$/, "");
}
