import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";
import type { SongPublic } from "../song-schema";

/**
 * Build a simple song fixture from a list of ids (test utility).
 *
 * @param ids - Song ids to include in the fixture.
 * @param overrides - Optional song overrides to merge into the generated fixture.
 * @returns A `SongPublic` fixture built from the provided ids.
 */
export default function makeSongFromIds(
	ids: string[],
	overrides: Partial<SongPublic> = {},
): ReturnType<typeof makeSongPublic> {
	const slides: Record<string, { slide_name: string; field_data: Record<string, string> }> = {};
	for (const id of ids) {
		slides[id] = { slide_name: `Slide ${id}`, field_data: { lyrics: `value-${id}` } };
	}

	return makeSongPublic({ slide_order: ids, slides, ...overrides });
}
