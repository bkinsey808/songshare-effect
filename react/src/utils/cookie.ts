export function getCookie(name: string): string | undefined {
	if (typeof document === "undefined") {
		return undefined;
	}

	const cookies = document.cookie ? document.cookie.split("; ") : [];
	for (const pair of cookies) {
		const idx = pair.indexOf("=");
		if (idx === -1) {
			continue;
		}
		const key = pair.slice(0, idx);
		const val = pair.slice(idx + 1);
		if (key === name) {
			return decodeURIComponent(val);
		}
	}

	return undefined;
}
