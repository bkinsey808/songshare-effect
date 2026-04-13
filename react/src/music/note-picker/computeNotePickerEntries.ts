import computeActiveSpellingIntervals from "@/react/music/intervals/computeActiveSpellingIntervals";
import {
	FLAT_INTERVAL_MAP,
	OCTAVE_SEMITONE_COUNT,
	ROOT_INTERVAL,
	SEMITONE_INTERVAL_LABELS,
} from "@/react/music/intervals/interval-constants";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";
import type { NotePickerEntry } from "@/react/music/note-picker/NotePickerEntry.type";
import DEFAULT_ROOT from "@/react/music/root-picker/defaultRoot";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

/**
 * Builds the 12 chromatic note entries for the note picker wheel.
 *
 * @param selectedBassNote - Active inversion bass note, if any
 * @param absoluteRoot - Resolved absolute chord root
 * @param fallbackLetterRoot - Absolute note used only for button labels when no root is selected
 * @param activeInversion - Currently selected inversion, if any
 * @param selectedShape - Currently selected chord shape
 * @returns Chromatic note entries with active interval and letter-name annotations
 */
export default function computeNotePickerEntries({
	selectedBassNote,
	absoluteRoot,
	fallbackLetterRoot,
	activeInversion,
	selectedShape,
}: Readonly<{
	selectedBassNote: SongKey | undefined;
	absoluteRoot: SongKey | undefined;
	fallbackLetterRoot?: SongKey | undefined;
	activeInversion: SciInversion | undefined;
	selectedShape: ChordShape | undefined;
}>): readonly NotePickerEntry[] {
	const notePickerRoot = selectedBassNote ?? absoluteRoot;
	const noteLabelRoot = notePickerRoot ?? fallbackLetterRoot;
	const noteLabelSemitone =
		noteLabelRoot === undefined ? undefined : (rootSemitoneMap[noteLabelRoot] ?? rootSemitoneMap[DEFAULT_ROOT]);
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
				noteLabelSemitone === undefined
					? undefined
					: songKeysBySemitone[
							(noteLabelSemitone + semitoneOffset) % OCTAVE_SEMITONE_COUNT
						],
		};
	});
}
