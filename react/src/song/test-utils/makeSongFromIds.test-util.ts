import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";

/**
 * Build a simple song fixture from a list of ids (test utility).
 *
 * @param ids - Song ids to include in the fixture.
 * @param fields - Field keys to include on each slide.
 * @returns A `SongPublic` fixture built from the provided ids.
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
