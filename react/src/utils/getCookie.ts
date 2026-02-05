/**
 * Read a cookie by name from `document.cookie`.
 *
 * @param name - The cookie name to read
 * @returns The decoded cookie value or `undefined` when not present or running server-side
 */
export default function getCookie(name: string): string | undefined {
	if (typeof document === "undefined") {
		return undefined;
	}

	const cookies = document.cookie ? document.cookie.split("; ") : [];
	const NO_INDEX = -1;
	const SLICE_START = 0;
	const SLICE_OFFSET = 1;

	for (const pair of cookies) {
		const idx = pair.indexOf("=");
		if (idx === NO_INDEX) {
			// malformed cookie pair, skip
		} else {
			const key = pair.slice(SLICE_START, idx);
			const val = pair.slice(idx + SLICE_OFFSET);
			if (key === name) {
				return decodeURIComponent(val);
			}
		}
	}

	return undefined;
}
