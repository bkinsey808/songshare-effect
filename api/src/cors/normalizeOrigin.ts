// Trim and remove trailing slashes from an origin string to normalize comparisons.
export function normalizeOrigin(raw: string): string {
	const trimmed = raw.trim();
	let end = trimmed.length;
	while (end > 0 && trimmed.charAt(end - 1) === "/") {
		end -= 1;
	}
	return trimmed.slice(0, end);
}
