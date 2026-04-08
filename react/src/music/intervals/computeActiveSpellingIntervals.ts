import type { ChordShape } from "@/shared/music/chord-shapes";

import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

/**
 * Returns the active interval labels for note picker highlighting.
 *
 * When an inversion is active, returns intervals re-rooted to the bass note
 * so the note picker reflects the inverted voicing rather than root position.
 *
 * @param activeInversion - Active inversion, or undefined for root position
 * @param selectedShape - Currently selected chord shape
 * @returns Array of interval label strings (e.g. ["b3", "b6"])
 */
export default function computeActiveSpellingIntervals({
	activeInversion,
	selectedShape,
}: Readonly<{
	activeInversion: SciInversion | undefined;
	selectedShape: ChordShape | undefined;
}>): string[] {
	if (activeInversion !== undefined) {
		return activeInversion.reRootedSpelling.split(",").map((i) => i.trim());
	}
	if (selectedShape === undefined || selectedShape.spelling === "") {
		return [];
	}
	return selectedShape.spelling.split(",").map((i) => i.trim());
}
