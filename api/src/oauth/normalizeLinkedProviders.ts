// Top-level helper: normalize `linked_providers` from validated data into string[].
export function normalizeLinkedProviders(validated: unknown): string[] {
	const lpRaw: unknown = (
		validated as unknown as { linked_providers?: unknown }
	).linked_providers;
	if (Array.isArray(lpRaw)) {
		return lpRaw.map((x) => (x === null ? "" : String(x))).filter(Boolean);
	}
	if (typeof lpRaw === "string") {
		return lpRaw
			.split(",")
			.map((str) => str.trim())
			.filter(Boolean);
	}
	return [];
}
