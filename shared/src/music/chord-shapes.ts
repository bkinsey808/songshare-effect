import sciListRaw from "@/shared/music/sci-list.json";

const MINIMUM_CHORD_NOTE_COUNT = 2;
const PREFERRED_FLAG = 1;
const DEFAULT_MIN_CHORD_NOTES = 2;
const DEFAULT_MAX_CHORD_NOTES = 4;
const SORT_LEFT_FIRST = -1;
const SORT_RIGHT_FIRST = 1;
const ZERO_INDEX = 0;
const NOT_FOUND_INDEX = -1;

type SciListEntry = Readonly<{
	id: number;
	txtName: string;
	txtCode: string;
	booPrefer: number;
	numNote: number;
	txtSpelling: string;
	numOrdering: number;
	txtNumIntervalForm: string;
	txtAltNames: string;
}>;

type ChordShape = Readonly<{
	id: number;
	name: string;
	code: string;
	prefer: boolean;
	noteCount: number;
	spelling: string;
	ordering: number;
	intervalForm: string;
	altNames: string;
	searchText: string;
}>;

const chordShapes: readonly ChordShape[] = (sciListRaw as readonly SciListEntry[])
	.filter((entry) => entry.numNote >= MINIMUM_CHORD_NOTE_COUNT)
	.map((entry) => ({
		id: entry.id,
		name: entry.txtName,
		code: entry.txtCode,
		prefer: entry.booPrefer === PREFERRED_FLAG,
		noteCount: entry.numNote,
		spelling: entry.txtSpelling,
		ordering: entry.numOrdering,
		intervalForm: entry.txtNumIntervalForm,
		altNames: entry.txtAltNames,
		searchText: normalizeSearchText([
			entry.txtName,
			entry.txtCode,
			entry.txtAltNames,
			String(entry.numNote),
		]),
	}))
	.reduce<ChordShape[]>((sortedShapes, shape) => insertChordShape(sortedShapes, shape), []);

/**
 * Returns the shared chord-shape catalog derived from `sci-list.json`.
 *
 * @returns Sorted chord-shape catalog for picker and display logic
 */
function getChordShapes(): readonly ChordShape[] {
	return chordShapes;
}

/**
 * Finds a chord shape by its SCI code.
 *
 * @param code - Chord-shape code such as `-`, `M7`, or `sus4`
 * @returns Matching chord shape when available
 */
function getChordShapeByCode(code: string): ChordShape | undefined {
	return chordShapes.find((shape) => shape.code === code);
}

/**
 * Searches the chord-shape catalog by name, code, aliases, and note count.
 *
 * Query tokens are AND-matched, so `major 7` returns shapes containing both terms. Results are
 * also filtered by the maximum number of notes, which defaults to tetrads.
 *
 * @param query - Search query text
 * @param minNotes - Minimum number of notes to include (defaults to 2)
 * @param maxNotes - Maximum number of notes to include (defaults to 4)
 * @returns Matching chord shapes sorted by preferred/common entries first
 */
function searchChordShapes({
	query,
	minNotes = DEFAULT_MIN_CHORD_NOTES,
	maxNotes = DEFAULT_MAX_CHORD_NOTES,
}: Readonly<{
	query: string;
	minNotes?: number;
	maxNotes?: number;
}>): readonly ChordShape[] {
	const normalizedQuery = normalizeSearchText([query]);
	const queryTokens = normalizedQuery === "" ? [] : normalizedQuery.split(" ");

	return chordShapes.filter((shape) => {
		if (shape.noteCount < minNotes || shape.noteCount > maxNotes) {
			return false;
		}

		return queryTokens.every((token) => shape.searchText.includes(token));
	});
}

/**
 * Normalizes human-entered search text into a lowercase, punctuation-light form.
 *
 * @param parts - Text fragments to combine into a searchable string
 * @returns Normalized search text used by the chord picker
 */
function normalizeSearchText(parts: readonly string[]): string {
	return parts
		.join(" ")
		.toLowerCase()
		.replaceAll(/[^a-z0-9#♯b♭,+/-]+/g, " ")
		.trim()
		.replaceAll(/\s+/g, " ");
}

/**
 * Sorts preferred/common shapes ahead of less common entries while keeping simpler voicings first.
 *
 * @param left - Left chord shape
 * @param right - Right chord shape
 * @returns Comparison result for array sorting
 */
function compareChordShapes(left: ChordShape, right: ChordShape): number {
	if (left.prefer !== right.prefer) {
		return left.prefer ? SORT_LEFT_FIRST : SORT_RIGHT_FIRST;
	}

	if (left.noteCount !== right.noteCount) {
		return left.noteCount - right.noteCount;
	}

	if (left.ordering !== right.ordering) {
		return left.ordering - right.ordering;
	}

	return left.name.localeCompare(right.name);
}

/**
 * Inserts a chord shape into an already-sorted array preserving ordering.
 *
 * @param sortedShapes - Array of chord shapes already sorted by preference and complexity
 * @param shape - New chord shape to insert
 * @returns A new array with the shape inserted at the correct position
 */
function insertChordShape(sortedShapes: readonly ChordShape[], shape: ChordShape): ChordShape[] {
	const insertionIndex = sortedShapes.findIndex(
		(existingShape) => compareChordShapes(shape, existingShape) < ZERO_INDEX,
	);
	if (insertionIndex === NOT_FOUND_INDEX) {
		return [...sortedShapes, shape];
	}

	return [
		...sortedShapes.slice(ZERO_INDEX, insertionIndex),
		shape,
		...sortedShapes.slice(insertionIndex),
	];
}

export {
	DEFAULT_MAX_CHORD_NOTES,
	DEFAULT_MIN_CHORD_NOTES,
	getChordShapeByCode,
	getChordShapes,
	searchChordShapes,
};

export type { ChordShape };
