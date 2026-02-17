import isRecord from "@/shared/type-guards/isRecord";

/**
 * Normalizes nullable fields from Supabase rows so they satisfy the generated
 * schema types that model optional values as `undefined`.
 *
 * @param value - Raw `event_public` row value
 * @returns Row with known nullable fields converted from `null` to `undefined`
 */
export default function normalizeEventPublicRow(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	const normalized = { ...value };
	const nullableKeys = [
		"active_playlist_id",
		"active_slide_position",
		"active_song_id",
		"event_date",
		"event_description",
		"public_notes",
		"created_at",
		"updated_at",
	] as const;

	for (const key of nullableKeys) {
		if (normalized[key] === null) {
			normalized[key] = undefined;
		}
	}

	return normalized;
}
