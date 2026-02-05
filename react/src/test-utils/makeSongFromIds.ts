import makeSongPublic from "@/react/test-utils/makeSongPublic";

/**
 * Build a simple song fixture from a list of ids (test utility).
 *
 * @param ids - Array of song ids
 * @param fields - Which fields to include on each slide
 * @returns Test object representing a song collection
 */
export default function makeSongFromIds(
	ids: string[],
	fields: ("lyrics" | "script" | "enTranslation")[] = ["lyrics"],
): ReturnType<typeof makeSongPublic> {
	const slides: Record<string, { slide_name: string; field_data: Record<string, string> }> = {};
	const FIRST_FIELD_INDEX = 0;
	for (const id of ids) {
		const fieldKey = fields[FIRST_FIELD_INDEX] ?? "lyrics";
		slides[id] = { slide_name: `Slide ${id}`, field_data: { [fieldKey]: `value-${id}` } };
	}

	return makeSongPublic({ slide_order: ids, slides, fields });
}
