import {
    INTERVAL_SEMITONE_OFFSET,
    OCTAVE_SEMITONE_COUNT,
    ROOT_INTERVAL,
} from "@/react/music/intervals/interval-constants";
import computeAbsoluteSelectedRoot from "@/react/music/root-picker/computeAbsoluteSelectedRoot";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import formatChordRootForDisplay from "@/shared/music/chord-display/formatChordRootForDisplay";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

type FlatNoteEntry = Readonly<{
	sameNatural: string;
	lowerNatural: string;
	sharpEquiv: SongKey;
}>;

const NOTE_NOT_FOUND = -1;
const SEQUENCE_START = 0;

const FLAT_NOTE_MAP: Readonly<Record<string, FlatNoteEntry>> = {
	Db: { sameNatural: "D", lowerNatural: "C", sharpEquiv: "C#" },
	Eb: { sameNatural: "E", lowerNatural: "D", sharpEquiv: "D#" },
	Ab: { sameNatural: "A", lowerNatural: "G", sharpEquiv: "G#" },
	Bb: { sameNatural: "B", lowerNatural: "A", sharpEquiv: "A#" },
};

/**
 * Builds a space-separated string of note names for the chord's letter-form preview.
 * Converts the selected root and shape spelling into absolute note names formatted
 * according to the given display mode.
 *
 * @param selectedRoot - The currently selected chord root
 * @param selectedShape - The currently selected chord shape, or undefined when none is chosen
 * @param chordDisplayMode - Display mode used to format each note name
 * @param songKey - Song key for roman-numeral root resolution and display formatting
 * @param bassNote - Optional bass note for slash-chord rotation in the display sequence
 * @returns A space-separated string of note names, or an empty string when the root cannot
 *   be resolved
 */
export default function formatLetterFormPreview({
	selectedRoot,
	selectedShape,
	chordDisplayMode,
	songKey,
	bassNote,
}: Readonly<{
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
	bassNote?: SongKey | undefined;
}>): string {
	const absoluteRoot = computeAbsoluteSelectedRoot(selectedRoot, songKey);
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
		.filter((root): root is SongKey => root !== undefined);

	const noteSet = new Set<string>(noteSequence);
	// When a slash chord is active, rotate the sequence to start from the bass note
	// so the display shows e.g. "Eb Gb B C" instead of "C Eb Gb B".
	const rawBassIndex = bassNote === undefined ? NOTE_NOT_FOUND : noteSequence.indexOf(bassNote);
	const startIndex = rawBassIndex === NOTE_NOT_FOUND ? SEQUENCE_START : rawBassIndex;
	const orderedSequence = [
		...noteSequence.slice(startIndex),
		...noteSequence.slice(SEQUENCE_START, startIndex),
	];
	const displaySequence = orderedSequence.map((note) => {
		const entry = FLAT_NOTE_MAP[note];
		if (entry === undefined) {
			return note;
		}
		return noteSet.has(entry.sameNatural) && !noteSet.has(entry.lowerNatural)
			? entry.sharpEquiv
			: note;
	});

	return displaySequence
		.map((root) =>
			formatChordRootForDisplay({
				root,
				chordDisplayMode,
				songKey,
			}),
		)
		.join(" ");
}
