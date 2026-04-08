import { getChordShapes, type ChordShape } from "@/shared/music/chord-shapes";

import { SEMITONE_INTERVAL_LABELS } from "./sciIntervalConstants";

const ROOT_SEMITONE_OFFSET = 0;
/** Start index for slicing SEMITONE_INTERVAL_LABELS to exclude the root interval. */
const NON_ROOT_INTERVAL_START = 1;
/** The root note is always counted, adding one to the interval count for total note count. */
const ROOT_NOTE_COUNT = 1;

/**
 * Derives the chord shape that results from toggling a chromatic note in or out.
 *
 * Toggles the interval at the given semitone offset within the current shape's spelling,
 * then returns the first known chord shape whose spelling matches the result.
 * Returns undefined when toggling the root (offset 0), when the offset has no interval label,
 * or when no known shape matches the resulting spelling.
 *
 * @param selectedShape - The current chord shape
 * @param semitoneOffset - Chromatic position to toggle (0 = root, always returns undefined)
 * @returns Matching chord shape from the catalog, a synthetic shape when no catalog match exists,
 *   or undefined when toggling the root or an out-of-range offset
 */
export default function computeShapeAfterNoteToggle({
	selectedShape,
	semitoneOffset,
}: Readonly<{
	selectedShape: ChordShape | undefined;
	semitoneOffset: number;
}>): ChordShape | undefined {
	if (semitoneOffset === ROOT_SEMITONE_OFFSET) {
		return undefined;
	}

	const interval = SEMITONE_INTERVAL_LABELS[semitoneOffset];
	if (interval === undefined) {
		return undefined;
	}

	const currentNonRootIntervals = new Set<string>(
		selectedShape?.spelling === ""
			? []
			: (selectedShape?.spelling.split(",").map((i) => i.trim()) ?? []),
	);

	if (currentNonRootIntervals.has(interval)) {
		currentNonRootIntervals.delete(interval);
	} else {
		currentNonRootIntervals.add(interval);
	}

	// Rebuild spelling in ascending semitone order (root "1" excluded from spelling).
	const newSpelling = SEMITONE_INTERVAL_LABELS.slice(NON_ROOT_INTERVAL_START)
		.filter((iv) => currentNonRootIntervals.has(iv))
		.join(",");

	const catalogShape = getChordShapes().find((shape) => shape.spelling === newSpelling);
	if (catalogShape !== undefined) {
		return catalogShape;
	}

	// No catalog match — return a synthetic shape so the note picker reflects the toggled state.
	return {
		id: 0,
		name: newSpelling,
		code: newSpelling,
		prefer: false,
		noteCount: currentNonRootIntervals.size + ROOT_NOTE_COUNT,
		spelling: newSpelling,
		ordering: 0,
		intervalForm: "",
		altNames: "",
		searchText: newSpelling,
	};
}
