/**
 * Normalize a validated `linked_providers` value into an array of provider
 * identifiers.
 *
 * @param validated - The parsed/validated input object which may include a
 *   `linked_providers` field (string or array).
 * @returns - An array of provider identifiers as strings. Returns an empty
 *   array when no providers are present or input is invalid.
 */
import isRecord from "@/shared/type-guards/isRecord";
import { safeGet } from "@/shared/utils/safe";

export default function normalizeLinkedProviders(validated: unknown): string[] {
	if (!isRecord(validated)) {
		return [];
	}

	const lpRaw = safeGet(validated, "linked_providers");
	if (Array.isArray(lpRaw)) {
		return lpRaw.map((rawVal) => (rawVal === null ? "" : String(rawVal))).filter(Boolean);
	}
	if (typeof lpRaw === "string") {
		return lpRaw
			.split(",")
			.map((str) => str.trim())
			.filter(Boolean);
	}
	return [];
}
