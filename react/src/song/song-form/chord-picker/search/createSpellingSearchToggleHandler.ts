import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const ROOT_SEMITONE_OFFSET = 0;

type CreateSpellingSearchToggleHandlerParams = Readonly<{
	setSpellingSearchState: (
		updater: (
			prev: ReadonlyMap<number, NoteSearchToggleState>,
		) => ReadonlyMap<number, NoteSearchToggleState>,
	) => void;
}>;

/**
 * Create a handler that toggles the stored spelling-search state for a given semitone offset.
 *
 * Unlike note-search toggles, spelling-search entries are stored directly by semitone
 * offset relative to the chord root.
 *
 * @param setSpellingSearchState - State setter that accepts an updater for the offset map
 * @returns A function that toggles the stored state for the provided semitone offset
 */
export default function createSpellingSearchToggleHandler({
	setSpellingSearchState,
}: CreateSpellingSearchToggleHandlerParams): (semitoneOffset: number) => void {
	return function handleSpellingSearchToggle(semitoneOffset: number): void {
		if (semitoneOffset === ROOT_SEMITONE_OFFSET) {
			return;
		}

		setSpellingSearchState((prev) => {
			const current = prev.get(semitoneOffset) ?? "default";
			const NEXT_STATE_MAP: Record<NoteSearchToggleState, NoteSearchToggleState> = {
				default: "required",
				required: "excluded",
				excluded: "default",
			};
			const nextState = NEXT_STATE_MAP[current];
			const next = new Map(prev);

			if (nextState === "default") {
				next.delete(semitoneOffset);
			} else {
				next.set(semitoneOffset, nextState);
			}

			return next;
		});
	};
}
