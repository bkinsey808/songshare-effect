import {
	OCTAVE_SEMITONE_COUNT,
	ROOT_INTERVAL,
	SEMITONE_INTERVAL_LABELS,
} from "@/react/music/intervals/interval-constants";
import type { NoteSearchEntry } from "@/react/music/note-picker/NoteSearchEntry.type";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { SongKey } from "@/shared/song/songKeyOptions";

/**
 * Builds the 12 chromatic interval-spelling entries for the Spelling Search control.
 *
 * Labels are interval spellings relative to the chord root ("1", "b3", "5"), with
 * optional absolute note labels when the current root can be resolved.
 *
 * @param absoluteRoot - Resolved absolute chord root for computing note labels
 * @param spellingSearchState - Map from semitone offset to toggle state
 * @returns Chromatic spelling-search entries with display labels and toggle states
 */
export default function computeSpellingSearchEntries({
	absoluteRoot,
	spellingSearchState,
}: Readonly<{
	absoluteRoot: SongKey | undefined;
	spellingSearchState: ReadonlyMap<number, NoteSearchToggleState>;
}>): readonly NoteSearchEntry[] {
	const rootSemitone = absoluteRoot === undefined ? undefined : rootSemitoneMap[absoluteRoot];

	return SEMITONE_INTERVAL_LABELS.map((displayInterval, semitoneOffset) => ({
		semitoneOffset,
		toggleState:
			displayInterval === ROOT_INTERVAL
				? "required"
				: (spellingSearchState.get(semitoneOffset) ?? "default"),
		displayInterval,
		letterName:
			rootSemitone === undefined
				? undefined
				: songKeysBySemitone[(rootSemitone + semitoneOffset) % OCTAVE_SEMITONE_COUNT],
	}));
}
