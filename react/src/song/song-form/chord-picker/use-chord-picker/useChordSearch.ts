import { useDeferredValue, useId, useState } from "react";

import computeAllShapeInversions from "@/react/music/inversions/computeAllShapeInversions";
import type {
	DirectShapeOrdinal,
	ShapeInversion,
} from "@/react/music/inversions/shape-inversion.type";
import computeNoteSearchEntries from "@/react/music/note-picker/computeNoteSearchEntries";
import computeNoteSearchRoot from "@/react/music/note-picker/computeNoteSearchRoot";
import type { NoteSearchEntry } from "@/react/music/note-picker/NoteSearchEntry.type";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import computeAbsoluteSelectedRoot from "@/react/music/root-picker/computeAbsoluteSelectedRoot";
import computeInitialSelectedRoot from "@/react/music/root-picker/computeInitialSelectedRoot";
import computeDisplayedShapes from "@/react/music/sci/computeDisplayedShapes";
import computeInitialMaxNotes from "@/react/music/sci/computeInitialMaxNotes";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import { DEFAULT_MIN_CHORD_NOTES, type ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import createNoteSearchToggleHandler from "./createNoteSearchToggleHandler";

type UseChordSearchParams = Readonly<{
	initialChordToken: string | undefined;
	absoluteRoot: SongKey | undefined;
	selectedShapeCode: string;
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
	rootPickerDisplayMode: ChordDisplayModeType;
}>;

type UseChordSearchResult = Readonly<{
	query: string;
	setQuery: (value: string) => void;
	minNotes: number;
	setMinNotes: (value: number) => void;
	maxNotes: number;
	setMaxNotes: (value: number) => void;
	includeInversions: boolean;
	setIncludeInversions: (value: boolean) => void;
	searchInputId: string;
	minNotesInputId: string;
	maxNotesInputId: string;
	includeInversionsInputId: string;
	displayedShapes: readonly ChordShape[];
	selectedShape: ChordShape | undefined;
	allShapeInversions: readonly ShapeInversion[];
	directShapeOrdinals: ReadonlyMap<string, DirectShapeOrdinal>;
	noteSearchEntries: readonly NoteSearchEntry[];
	getNoteSearchRoot: (spelling: string) => SongKey | undefined;
	handleNoteSearchToggle: (semitoneOffset: number) => void;
}>;

/**
 * Manages chord search field state, filtering, and displayed search results.
 *
 * @param initialChordToken - Existing chord token used to derive initial max-note filter
 * @param absoluteRoot - Current absolute root note for note-search toggle handling
 * @param selectedShapeCode - Currently selected shape code for result highlighting
 * @param songKey - Current song key used for note-search label generation
 * @param chordDisplayMode - Active chord display mode for inversion token rendering
 * @param rootPickerDisplayMode - Display mode used to derive the initial note-search root
 * @returns Search state, setter callbacks, derived shape/inversion lists, and handlers
 */
export default function useChordSearch({
	initialChordToken,
	absoluteRoot,
	selectedShapeCode,
	songKey,
	chordDisplayMode,
	rootPickerDisplayMode,
}: UseChordSearchParams): UseChordSearchResult {
	const [query, setQuery] = useState("");
	const [minNotes, setMinNotes] = useState(DEFAULT_MIN_CHORD_NOTES);
	const [maxNotes, setMaxNotes] = useState(() => computeInitialMaxNotes({ initialChordToken }));
	const [includeInversions, setIncludeInversions] = useState(false);
	const deferredIncludeInversions = useDeferredValue(includeInversions);
	const includeInversionsInputId = useId();

	const FALLBACK_SEMITONE = 0;
	const [noteSearchState, setNoteSearchState] = useState<
		ReadonlyMap<number, NoteSearchToggleState>
	>(() => {
		const initialSelectedRoot = computeInitialSelectedRoot({
			chordDisplayMode: rootPickerDisplayMode,
			initialChordToken,
			songKey,
		});
		const initialAbsoluteRoot = computeAbsoluteSelectedRoot(initialSelectedRoot, songKey);
		const initialRootSemitone =
			initialAbsoluteRoot === undefined
				? FALLBACK_SEMITONE
				: (rootSemitoneMap[initialAbsoluteRoot] ?? FALLBACK_SEMITONE);
		return new Map<number, NoteSearchToggleState>([[initialRootSemitone, "required"]]);
	});

	const searchInputId = useId();
	const minNotesInputId = useId();
	const maxNotesInputId = useId();

	const { displayedShapes, selectedShape } = computeDisplayedShapes({
		query,
		minNotes,
		maxNotes,
		noteSearchState,
		selectedShapeCode,
	});

	const handleNoteSearchToggle = createNoteSearchToggleHandler({
		absoluteRoot,
		setNoteSearchState,
	});

	const noteSearchEntries = computeNoteSearchEntries({ absoluteRoot, songKey, noteSearchState });

	const { inversions: allShapeInversions, directShapeOrdinals } = computeAllShapeInversions({
		deferredIncludeInversions,
		query,
		minNotes,
		maxNotes,
		noteSearchState,
		displayedShapes,
		songKey,
		chordDisplayMode,
	});

	function getNoteSearchRoot(spelling: string): SongKey | undefined {
		return computeNoteSearchRoot(spelling, noteSearchState);
	}

	return {
		query,
		setQuery,
		minNotes,
		setMinNotes,
		maxNotes,
		setMaxNotes,
		includeInversions,
		setIncludeInversions,
		searchInputId,
		minNotesInputId,
		maxNotesInputId,
		includeInversionsInputId,
		displayedShapes,
		selectedShape,
		allShapeInversions,
		directShapeOrdinals,
		noteSearchEntries,
		getNoteSearchRoot,
		handleNoteSearchToggle,
	};
}
