import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import type { SongKey } from "@/shared/song/songKeyOptions";

import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/interval-constants";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const FALLBACK_SEMITONE = 0;

type CreateNoteSearchToggleHandlerParams = Readonly<{
	absoluteRoot: SongKey | undefined;
	setNoteSearchState: (
		updater: (
			prev: ReadonlyMap<number, NoteSearchToggleState>,
		) => ReadonlyMap<number, NoteSearchToggleState>,
	) => void;
}>;

/**
 * Returns a handler that cycles the note search toggle state for a given semitone offset.
 * The offset is relative to the current absolute root; the result is stored as an absolute semitone.
 *
 * @param absoluteRoot - The current absolute root key (used to compute absolute semitone)
 * @param setNoteSearchState - Setter for the note-search toggle map
 * @returns A callback that accepts a positional semitone offset (0-11)
 */
export default function createNoteSearchToggleHandler({
	absoluteRoot,
	setNoteSearchState,
}: CreateNoteSearchToggleHandlerParams): (semitoneOffset: number) => void {
	return function handleNoteSearchToggle(semitoneOffset: number): void {
		// Convert the button's positional offset to the absolute semitone it represents,
		// then store/toggle that absolute semitone in noteSearchState.
		const absoluteRootSemitone =
			absoluteRoot === undefined
				? FALLBACK_SEMITONE
				: (rootSemitoneMap[absoluteRoot] ?? FALLBACK_SEMITONE);
		const absoluteSemitone = (absoluteRootSemitone + semitoneOffset) % OCTAVE_SEMITONE_COUNT;
		setNoteSearchState((prev) => {
			const current = prev.get(absoluteSemitone) ?? "default";
			const NEXT_STATE_MAP: Record<NoteSearchToggleState, NoteSearchToggleState> = {
				default: "required",
				required: "excluded",
				excluded: "default",
			};
			const nextState = NEXT_STATE_MAP[current];
			const next = new Map(prev);
			if (nextState === "default") {
				next.delete(absoluteSemitone);
			} else {
				next.set(absoluteSemitone, nextState);
			}
			return next;
		});
	};
}
