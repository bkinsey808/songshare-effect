import formatChordRootForDisplay from "@/shared/music/chord-display/formatChordRootForDisplay";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import {
	INTERVAL_SEMITONE_OFFSET,
	OCTAVE_SEMITONE_COUNT,
	ROOT_INTERVAL,
} from "../chordPickerConstants";
import getAbsoluteSelectedRoot from "./getAbsoluteSelectedRoot";
import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";

/**
 * Builds a space-separated string of note names for the chord's letter-form preview.
 * Converts the selected root and shape spelling into absolute note names formatted
 * according to the given display mode.
 *
 * @param selectedRoot - The currently selected chord root
 * @param selectedShape - The currently selected chord shape, or undefined when none is chosen
 * @param chordDisplayMode - Display mode used to format each note name
 * @param songKey - Song key for roman-numeral root resolution and display formatting
 * @returns A space-separated string of note names, or an empty string when the root cannot
 *   be resolved
 */
export default function formatLetterFormPreview({
	selectedRoot,
	selectedShape,
	chordDisplayMode,
	songKey,
}: Readonly<{
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): string {
	const absoluteRoot = getAbsoluteSelectedRoot(selectedRoot, songKey);
	if (absoluteRoot === undefined) {
		return "";
	}

	const rootSemitone = rootSemitoneMap[absoluteRoot];
	const intervals =
		selectedShape?.spelling === "" ? [] : (selectedShape?.spelling.split(",") ?? []);
	const noteSequence = [ROOT_INTERVAL, ...intervals]
		.map((interval) => interval.trim())
		.map((interval) => INTERVAL_SEMITONE_OFFSET[interval])
		.filter((offset): offset is number => offset !== undefined)
		.map((offset) => songKeysBySemitone[(rootSemitone + offset) % OCTAVE_SEMITONE_COUNT])
		.filter((root): root is SongKey => root !== undefined)
		.map((root) =>
			formatChordRootForDisplay({
				root,
				chordDisplayMode,
				songKey,
			}),
		);

	return noteSequence.join(" ");
}
