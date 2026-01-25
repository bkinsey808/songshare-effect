export default function computeSlideOrder(pub?: Record<string, unknown>): string[] {
	if (!pub || !Array.isArray(pub["slide_order"])) {
		return [];
	}
	const out: string[] = [];
	const arr = pub["slide_order"] as unknown[];
	for (const item of arr) {
		if (typeof item === "string" || typeof item === "number") {
			out.push(String(item));
		}
	}
	return out;
}
