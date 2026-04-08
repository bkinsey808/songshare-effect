import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

import {
	OCTAVE_SEMITONE_COUNT,
	ROOT_INTERVAL,
	SEMITONE_INTERVAL_LABELS,
} from "@/react/music/intervals/sciIntervalConstants";
import type { NotePickerEntry } from "@/react/music/note-picker/NotePickerEntry.type";
import { FLAT_INTERVAL_MAP } from "@/react/music/intervals/preferSharpIntervals";
import computeActiveSpellingIntervals from "@/react/music/intervals/computeActiveSpellingIntervals";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

/**
 * Builds the 12 chromatic note entries for the note picker wheel.
 *
 * @param selectedBassNote - Active inversion bass note, if any
 * @param absoluteRoot - Resolved absolute chord root
 * @param activeInversion - Currently selected inversion, if any
 * @param selectedShape - Currently selected chord shape
 * @returns Chromatic note entries with active interval and letter-name annotations
 */
export default function computeNotePickerEntries({
	selectedBassNote,
	absoluteRoot,
	activeInversion,
	selectedShape,
}: Readonly<{
	selectedBassNote: SongKey | undefined;
	absoluteRoot: SongKey | undefined;
	activeInversion: SciInversion | undefined;
	selectedShape: ChordShape | undefined;
}>): readonly NotePickerEntry[] {
	const notePickerRoot = selectedBassNote ?? absoluteRoot;
	const rootSemitone = notePickerRoot === undefined ? undefined : rootSemitoneMap[notePickerRoot];
	const activeNonRootIntervals = computeActiveSpellingIntervals({ activeInversion, selectedShape });
	const activeIntervalSet = new Set<string>([ROOT_INTERVAL, ...activeNonRootIntervals]);

	return SEMITONE_INTERVAL_LABELS.map((interval, semitoneOffset) => {
		const isActive = activeIntervalSet.has(interval);
		const flatEntry = FLAT_INTERVAL_MAP[interval];
		// Only switch to sharp for active notes: inactive notes always show the flat spelling.
		const displayInterval =
			isActive &&
			flatEntry !== undefined &&
			activeIntervalSet.has(flatEntry.sameNatural) &&
			!activeIntervalSet.has(flatEntry.lowerNatural)
				? flatEntry.sharpEquiv
				: interval;

		return {
			interval,
			displayInterval,
			semitoneOffset,
			isActive,
			letterName:
				rootSemitone === undefined
					? undefined
					: songKeysBySemitone[(rootSemitone + semitoneOffset) % OCTAVE_SEMITONE_COUNT],
		};
	});
}
