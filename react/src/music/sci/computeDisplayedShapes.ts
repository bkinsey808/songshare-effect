import {
	getChordShapeByCode,
	searchChordShapes,
	type ChordShape,
} from "@/shared/music/chord-shapes";

import filterShapeByNoteSearch from "@/react/music/note-picker/filterShapeByNoteSearch";
import filterSpellingBySpellingSearch from "@/react/music/note-picker/filterSpellingBySpellingSearch";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const FIRST_SHAPE_INDEX = 0;

/** The root note is always counted, adding one to the interval count for total note count. */
const ROOT_NOTE_COUNT = 1;

/**
 * Derives the ordered shape list and currently selected shape for the chord picker.
 *
 * When the selected shape appears in the search results it is pinned to the top;
 * otherwise the raw search results are returned as-is.
 *
 * @param query - Current search query string
 * @param minNotes - Minimum note count filter
 * @param maxNotes - Maximum note count filter
 * @param noteSearchState - Note search filter: required/excluded states by semitone offset
 * @param spellingSearchState - Spelling search filter: required/excluded states by interval offset
 * @param selectedShapeCode - Code of the currently selected chord shape
 * @returns Ordered shape list and the resolved selected shape
 */
export default function computeDisplayedShapes({
	query,
	minNotes,
	maxNotes,
	noteSearchState,
	spellingSearchState,
	selectedShapeCode,
}: Readonly<{
	query: string;
	minNotes: number;
	maxNotes: number;
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>;
	spellingSearchState: ReadonlyMap<number, NoteSearchToggleState>;
	selectedShapeCode: string;
}>): Readonly<{
	displayedShapes: readonly ChordShape[];
	selectedShape: ChordShape | undefined;
}> {
	const availableShapes = searchChordShapes({ query, minNotes, maxNotes }).filter(
		(shape) =>
			filterShapeByNoteSearch(shape, noteSearchState) &&
			filterSpellingBySpellingSearch(shape.spelling, spellingSearchState),
	);
	const selectedShapeInResults = availableShapes.find((shape) => shape.code === selectedShapeCode);
	const displayedShapes =
		selectedShapeInResults === undefined
			? availableShapes
			: [
					selectedShapeInResults,
					...availableShapes.filter((shape) => shape.code !== selectedShapeInResults.code),
				];
	const selectedShape =
		getChordShapeByCode(selectedShapeCode) ??
		// Synthetic shape: code is the spelling itself (contains commas), used when toggling
		// a note produces an interval combination that has no catalog entry.
		(selectedShapeCode.includes(",")
			? {
					id: 0,
					name: selectedShapeCode,
					code: selectedShapeCode,
					prefer: false,
					noteCount: selectedShapeCode.split(",").length + ROOT_NOTE_COUNT,
					spelling: selectedShapeCode,
					ordering: 0,
					intervalForm: "",
					altNames: "",
					searchText: selectedShapeCode,
				}
			: undefined) ??
		displayedShapes[FIRST_SHAPE_INDEX];
	return { displayedShapes, selectedShape };
}
