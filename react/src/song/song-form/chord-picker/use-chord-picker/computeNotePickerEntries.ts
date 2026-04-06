import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

import {
    OCTAVE_SEMITONE_COUNT,
    ROOT_INTERVAL,
    SEMITONE_INTERVAL_LABELS,
} from "../chordPickerConstants";
import type { NotePickerEntry } from "../note-picker/NotePicker";
import getActiveSpellingIntervals from "./getActiveSpellingIntervals";
import type { ChordInversion } from "./getChordInversions";

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
	activeInversion: ChordInversion | undefined;
	selectedShape: ChordShape | undefined;
}>): readonly NotePickerEntry[] {
	const notePickerRoot = selectedBassNote ?? absoluteRoot;
	const rootSemitone = notePickerRoot === undefined ? undefined : rootSemitoneMap[notePickerRoot];
	const activeIntervalSet = new Set<string>([
		ROOT_INTERVAL,
		...getActiveSpellingIntervals({ activeInversion, selectedShape }),
	]);
	return SEMITONE_INTERVAL_LABELS.map((interval, semitoneOffset) => ({
		interval,
		semitoneOffset,
		isActive: activeIntervalSet.has(interval),
		letterName:
			rootSemitone === undefined
				? undefined
				: songKeysBySemitone[(rootSemitone + semitoneOffset) % OCTAVE_SEMITONE_COUNT],
	}));
}
