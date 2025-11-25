import { safeGet } from "@/shared/utils/safe";
// Top-level helper: normalize `linked_providers` from validated data into string[].
import { isRecord } from "@/shared/utils/typeGuards";

export function normalizeLinkedProviders(validated: unknown): string[] {
	if (!isRecord(validated)) {
		return [];
	}

	const lpRaw = safeGet(validated, "linked_providers");
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
