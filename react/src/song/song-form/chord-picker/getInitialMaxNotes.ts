import { DEFAULT_MAX_CHORD_NOTES, getChordShapeByCode } from "@/shared/music/chord-shapes";

import getInitialShapeCode from "./getInitialShapeCode";

/**
 * Derives the initial max-note filter from the current chord shape when available.
 *
 * @param initialChordToken - Existing chord token when editing
 * @returns Initial max-note filter for the shape search
 */
export default function getInitialMaxNotes({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): number {
	if (initialChordToken === undefined) {
		return DEFAULT_MAX_CHORD_NOTES;
	}

	const shapeCode = getInitialShapeCode({ initialChordToken });
	return getChordShapeByCode(shapeCode)?.noteCount ?? DEFAULT_MAX_CHORD_NOTES;
}
