import { DEFAULT_MAX_CHORD_NOTES, getChordShapeByCode } from "@/shared/music/chord-shapes";

import computeInitialShapeCode from "@/react/music/sci/computeInitialShapeCode";

/**
 * Derives the initial max-note filter from the current chord shape when available.
 *
 * @param initialChordToken - Existing chord token when editing
 * @returns Initial max-note filter for the shape search
 */
export default function computeInitialMaxNotes({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): number {
	if (initialChordToken === undefined) {
		return DEFAULT_MAX_CHORD_NOTES;
	}

	const shapeCode = computeInitialShapeCode({ initialChordToken });
	return getChordShapeByCode(shapeCode)?.noteCount ?? DEFAULT_MAX_CHORD_NOTES;
}
