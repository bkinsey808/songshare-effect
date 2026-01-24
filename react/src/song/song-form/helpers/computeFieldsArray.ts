export default function computeFieldsArray(pub?: Record<string, unknown>): string[] {
	if (!pub || !Array.isArray(pub["fields"])) {
		return [];
	}
	const out: string[] = [];
	const fields = pub["fields"] as unknown[];
	for (const raw of fields) {
		if (typeof raw === "string") {
			out.push(raw);
		} else if (typeof raw === "number") {
			out.push(String(raw));
		}
	}
	return out;
}
