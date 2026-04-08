import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { SongKey } from "@/shared/song/songKeyOptions";

import { OCTAVE_SEMITONE_COUNT, SEMITONE_ROMAN_LABELS } from "@/react/music/intervals/sciIntervalConstants";
import type { NoteSearchEntry } from "@/react/music/note-picker/NoteSearchEntry.type";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

/**
 * Builds the 12 chromatic note entries for the Note Search filter control.
 *
 * Labels use Roman numerals relative to the song key so that, for example,
 * C is always "I" when the song key is C regardless of the chord root.
 * Buttons still start at the chord root position (like the Note Picker).
 *
 * @param absoluteRoot - Resolved absolute chord root for computing letter names
 * @param songKey - Song key used as the reference for Roman numeral labelling
 * @param noteSearchState - Map from semitone offset to toggle state (default, required, excluded)
 * @returns Chromatic note entries with toggle state and display labels
 */
export default function computeNoteSearchEntries({
	absoluteRoot,
	songKey,
	noteSearchState,
}: Readonly<{
	absoluteRoot: SongKey | undefined;
	songKey: SongKey | "";
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>;
}>): readonly NoteSearchEntry[] {
	const rootSemitone = absoluteRoot === undefined ? undefined : rootSemitoneMap[absoluteRoot];
	const songKeySemitone = songKey === "" ? undefined : rootSemitoneMap[songKey];

	return SEMITONE_ROMAN_LABELS.map((_romanLabel, semitoneOffset) => {
		// Compute the absolute semitone for this button position, then express
		// it as a Roman numeral relative to the song key.
		const absoluteSemitone =
			rootSemitone === undefined
				? undefined
				: (rootSemitone + semitoneOffset) % OCTAVE_SEMITONE_COUNT;
		// noteSearchState keys are absolute semitones — look up by absolute pitch
		const toggleState =
			absoluteSemitone === undefined
				? "default"
				: (noteSearchState.get(absoluteSemitone) ?? "default");
		const romanOffset =
			absoluteSemitone === undefined || songKeySemitone === undefined
				? semitoneOffset
				: (absoluteSemitone - songKeySemitone + OCTAVE_SEMITONE_COUNT) % OCTAVE_SEMITONE_COUNT;
		const displayInterval = SEMITONE_ROMAN_LABELS[romanOffset] ?? "?";

		return {
			semitoneOffset,
			toggleState,
			displayInterval,
			letterName: absoluteSemitone === undefined ? undefined : songKeysBySemitone[absoluteSemitone],
		};
	});
}
