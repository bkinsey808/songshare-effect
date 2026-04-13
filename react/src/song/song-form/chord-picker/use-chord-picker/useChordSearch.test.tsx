import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { DEFAULT_MAX_CHORD_NOTES, DEFAULT_MIN_CHORD_NOTES } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import {
	ChordDisplayMode,
	type ChordDisplayModeType,
} from "@/shared/user/chord-display/effectiveChordDisplayMode";

import useChordSearch from "./useChordSearch";

// ── Fixture constants ──────────────────────────────────────────────────────

const SONG_KEY_C = "C" as const;
const ABSOLUTE_ROOT_C = "C" as const;
const EMPTY_SHAPE_CODE = "";
const MAJOR_SHAPE_CODE = "M";
// Token format: "[<root> <shapeCode>]" — used to simulate an existing chord being edited.
const INITIAL_TOKEN_C_MAJOR = "[C M]";
// A major triad (C) has three notes: root, major third, perfect fifth.
const TRIAD_NOTE_COUNT = 3;
const NOTE_SEARCH_ENTRY_COUNT = 12;
const SPELLING_SEARCH_ENTRY_COUNT = 12;
// Offset 0 is the root button in the note search grid.
const ROOT_SEMITONE_OFFSET = 0;
const PERFECT_FIFTH_SEMITONE_OFFSET = 7;
// Interval spelling for a major triad: major third ("3") + perfect fifth ("5").
const MAJOR_TRIAD_SPELLING = "3,5";
const QUERY_MAJOR = "major";
const MINIMUM_SHAPE_COUNT = 1;
const MIN_NOTES_THREE = 3;
const MAX_NOTES_FIVE = 5;
const INVERSION_COUNT_ZERO = 0;
const MAJOR_CHORD_NAME = "Major Chord";

const DEFAULT_PARAMS: {
	initialChordToken: string | undefined;
	absoluteRoot: SongKey | undefined;
	selectedShapeCode: string;
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
	rootPickerDisplayMode: ChordDisplayModeType;
} = {
	initialChordToken: undefined,
	absoluteRoot: ABSOLUTE_ROOT_C,
	selectedShapeCode: EMPTY_SHAPE_CODE,
	songKey: SONG_KEY_C,
	chordDisplayMode: ChordDisplayMode.letters,
	rootPickerDisplayMode: ChordDisplayMode.letters,
};

// ── Harness ────────────────────────────────────────────────────────────────

/**
 * Harness for useChordSearch.
 *
 * Shows how useChordSearch integrates into a real chord picker UI:
 * - A text input (query) whose value filters the displayed chord shape list
 * - Number inputs (minNotes, maxNotes) that bound the note-count range filter
 * - A checkbox (includeInversions) that, when checked, populates allShapeInversions
 * - A list of displayed chord shapes (displayedShapes), each keyed by shape code
 * - The name of the currently selected shape (selectedShape)
 * - Counts exposing allShapeInversions and directShapeOrdinals sizes
 * - Twelve note-search buttons (noteSearchEntries) whose toggle state cycles on click,
 *   driven by handleNoteSearchToggle
 * - The resolved SongKey for a major triad spelling (getNoteSearchRoot)
 *
 * @param initialChordToken - Pre-existing chord token when editing an existing chord (undefined = new)
 * @param absoluteRoot - Resolved absolute chord root for note letter labels and toggle calculation
 * @param selectedShapeCode - Code of the currently selected chord shape for result highlighting
 * @param songKey - Song key used for Roman numeral interval labels in the note search grid
 * @param chordDisplayMode - Display mode controlling how inversion tokens are formatted
 * @param rootPickerDisplayMode - Display mode used to derive the initial note search root
 */
function Harness({
	initialChordToken,
	absoluteRoot,
	selectedShapeCode,
	songKey,
	chordDisplayMode,
	rootPickerDisplayMode,
}: {
	initialChordToken: string | undefined;
	absoluteRoot: SongKey | undefined;
	selectedShapeCode: string;
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
	rootPickerDisplayMode: ChordDisplayModeType;
}): ReactElement {
	const {
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
		spellingSearchEntries,
		noteSearchEntries,
		getNoteSearchRoot,
		handleSpellingSearchToggle,
		handleNoteSearchToggle,
	} = useChordSearch({
		initialChordToken,
		absoluteRoot,
		selectedShapeCode,
		songKey,
		chordDisplayMode,
		rootPickerDisplayMode,
	});

	return (
		<div>
			{/* query: controlled value for the chord name search field */}
			<input
				data-testid="query-input"
				id={searchInputId}
				value={query}
				onChange={(ev) => {
					setQuery(ev.target.value);
				}}
			/>
			{/* minNotes: lower note-count bound — shapes below this are excluded */}
			<input
				data-testid="min-notes-input"
				id={minNotesInputId}
				type="number"
				value={minNotes}
				onChange={(ev) => {
					setMinNotes(Number(ev.target.value));
				}}
			/>
			{/* maxNotes: upper note-count bound — shapes above this are excluded */}
			<input
				data-testid="max-notes-input"
				id={maxNotesInputId}
				type="number"
				value={maxNotes}
				onChange={(ev) => {
					setMaxNotes(Number(ev.target.value));
				}}
			/>
			{/* includeInversions: when checked, allShapeInversions is populated */}
			<input
				data-testid="include-inversions-input"
				id={includeInversionsInputId}
				type="checkbox"
				checked={includeInversions}
				onChange={(ev) => {
					setIncludeInversions(ev.target.checked);
				}}
			/>
			{/* displayedShapes: chord shapes matching query and note-count range, selection pinned first */}
			<ul data-testid="displayed-shapes">
				{displayedShapes.map((shape) => (
					<li key={shape.code} data-testid={`shape-${shape.code}`}>
						{shape.name}
					</li>
				))}
			</ul>
			{/* selectedShape: the currently highlighted chord shape (falls back to first result) */}
			<div data-testid="selected-shape-name">{selectedShape?.name ?? ""}</div>
			{/* allShapeInversions: non-empty only when includeInversions is true */}
			<div data-testid="inversion-count">{String(allShapeInversions.length)}</div>
			{/* directShapeOrdinals: direct result shapes that are also known inversions */}
			<div data-testid="direct-ordinal-count">{String(directShapeOrdinals.size)}</div>
			<ul data-testid="spelling-search-entries">
				{spellingSearchEntries.map((entry) => (
					<li
						key={`spelling-${String(entry.semitoneOffset)}`}
						data-testid={`spelling-entry-${String(entry.semitoneOffset)}`}
						data-toggle-state={entry.toggleState}
						onClick={() => {
							handleSpellingSearchToggle(entry.semitoneOffset);
						}}
						onKeyDown={() => {
							handleSpellingSearchToggle(entry.semitoneOffset);
						}}
					>
						{entry.displayInterval}
					</li>
				))}
			</ul>
			{/* noteSearchEntries: 12 chromatic positions whose toggle state cycles on click */}
			<ul data-testid="note-search-entries">
				{noteSearchEntries.map((entry) => (
					<li
						key={String(entry.semitoneOffset)}
						data-testid={`note-entry-${String(entry.semitoneOffset)}`}
						data-toggle-state={entry.toggleState}
						onClick={() => {
							handleNoteSearchToggle(entry.semitoneOffset);
						}}
						onKeyDown={() => {
							handleNoteSearchToggle(entry.semitoneOffset);
						}}
					>
						{entry.displayInterval}
					</li>
				))}
			</ul>
			{/* getNoteSearchRoot: resolves a major triad spelling to the matching SongKey */}
			<div data-testid="note-search-root">{getNoteSearchRoot(MAJOR_TRIAD_SPELLING) ?? ""}</div>
		</div>
	);
}

// ── Harness tests ──────────────────────────────────────────────────────────

describe("useChordSearch — Harness", () => {
	it("shows empty query and default note-count range on initial render", () => {
		// cleanup() is required: this project cannot auto-register afterEach(cleanup)
		// (no globals:true, and afterEach is disallowed by the linter). Each harness
		// test starts clean by calling cleanup() itself.
		cleanup();

		// Arrange
		const rendered = render(
			<Harness
				initialChordToken={undefined}
				absoluteRoot={ABSOLUTE_ROOT_C}
				selectedShapeCode={EMPTY_SHAPE_CODE}
				songKey={SONG_KEY_C}
				chordDisplayMode={ChordDisplayMode.letters}
				rootPickerDisplayMode={ChordDisplayMode.letters}
			/>,
		);

		// Assert — no Act: verifying initial render state only
		expect(
			forceCast<HTMLInputElement>(within(rendered.container).getByTestId("query-input")).value,
		).toBe("");
		expect(
			forceCast<HTMLInputElement>(within(rendered.container).getByTestId("min-notes-input")).value,
		).toBe(String(DEFAULT_MIN_CHORD_NOTES));
		expect(
			forceCast<HTMLInputElement>(within(rendered.container).getByTestId("max-notes-input")).value,
		).toBe(String(DEFAULT_MAX_CHORD_NOTES));
		expect(
			forceCast<HTMLInputElement>(
				within(rendered.container).getByTestId("include-inversions-input"),
			).checked,
		).toBe(false);
	});

	it("narrows displayedShapes when a specific query is typed into the search input", async () => {
		cleanup();

		// Arrange
		const rendered = render(
			<Harness
				initialChordToken={undefined}
				absoluteRoot={ABSOLUTE_ROOT_C}
				selectedShapeCode={EMPTY_SHAPE_CODE}
				songKey={SONG_KEY_C}
				chordDisplayMode={ChordDisplayMode.letters}
				rootPickerDisplayMode={ChordDisplayMode.letters}
			/>,
		);
		const countBefore = within(rendered.container)
			.getByTestId("displayed-shapes")
			.querySelectorAll("li").length;

		// Act
		fireEvent.change(within(rendered.container).getByTestId("query-input"), {
			target: { value: QUERY_MAJOR },
		});

		// Assert
		await waitFor(() => {
			const countAfter = within(rendered.container)
				.getByTestId("displayed-shapes")
				.querySelectorAll("li").length;
			expect(countAfter).toBeLessThan(countBefore);
		});
	});

	it("marks include-inversions checkbox as checked when toggled", async () => {
		cleanup();

		// Arrange
		const rendered = render(
			<Harness
				initialChordToken={undefined}
				absoluteRoot={ABSOLUTE_ROOT_C}
				selectedShapeCode={EMPTY_SHAPE_CODE}
				songKey={SONG_KEY_C}
				chordDisplayMode={ChordDisplayMode.letters}
				rootPickerDisplayMode={ChordDisplayMode.letters}
			/>,
		);

		// Act
		fireEvent.click(within(rendered.container).getByTestId("include-inversions-input"));

		// Assert
		await waitFor(() => {
			expect(
				forceCast<HTMLInputElement>(
					within(rendered.container).getByTestId("include-inversions-input"),
				).checked,
			).toBe(true);
		});
	});

	it("cycles the root note entry from required to excluded when clicked", async () => {
		cleanup();

		// Arrange
		const rendered = render(
			<Harness
				initialChordToken={undefined}
				absoluteRoot={ABSOLUTE_ROOT_C}
				selectedShapeCode={EMPTY_SHAPE_CODE}
				songKey={SONG_KEY_C}
				chordDisplayMode={ChordDisplayMode.letters}
				rootPickerDisplayMode={ChordDisplayMode.letters}
			/>,
		);
		const rootEntry = within(rendered.container).getByTestId(
			`note-entry-${String(ROOT_SEMITONE_OFFSET)}`,
		);
		expect(rootEntry.dataset["toggleState"]).toBe("required");

		// Act
		fireEvent.click(rootEntry);

		// Assert
		await waitFor(() => {
			expect(
				within(rendered.container).getByTestId(`note-entry-${String(ROOT_SEMITONE_OFFSET)}`)
					.dataset["toggleState"],
			).toBe("excluded");
		});
	});

	it("keeps the spelling root entry required when clicked", async () => {
		cleanup();

		const rendered = render(
			<Harness
				initialChordToken={undefined}
				absoluteRoot={ABSOLUTE_ROOT_C}
				selectedShapeCode={EMPTY_SHAPE_CODE}
				songKey={SONG_KEY_C}
				chordDisplayMode={ChordDisplayMode.letters}
				rootPickerDisplayMode={ChordDisplayMode.letters}
			/>,
		);
		const rootEntry = within(rendered.container).getByTestId(
			`spelling-entry-${String(ROOT_SEMITONE_OFFSET)}`,
		);
		expect(rootEntry.dataset["toggleState"]).toBe("required");

		fireEvent.click(rootEntry);

		await waitFor(() => {
			expect(
				within(rendered.container).getByTestId(`spelling-entry-${String(ROOT_SEMITONE_OFFSET)}`)
					.dataset["toggleState"],
			).toBe("required");
		});
	});
});

// ── renderHook tests ───────────────────────────────────────────────────────

describe("useChordSearch — renderHook", () => {
	it("returns empty query initially", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.query).toBe("");
	});

	it("returns DEFAULT_MIN_CHORD_NOTES for minNotes initially", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.minNotes).toStrictEqual(DEFAULT_MIN_CHORD_NOTES);
	});

	it("returns DEFAULT_MAX_CHORD_NOTES for maxNotes when initialChordToken is undefined", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.maxNotes).toStrictEqual(DEFAULT_MAX_CHORD_NOTES);
	});

	it("returns false for includeInversions initially", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.includeInversions).toBe(false);
	});

	it("setQuery updates query", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Act
		result.current.setQuery(QUERY_MAJOR);

		// Assert
		await waitFor(() => {
			expect(result.current.query).toBe(QUERY_MAJOR);
		});
	});

	it("setMinNotes updates minNotes", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Act
		result.current.setMinNotes(MIN_NOTES_THREE);

		// Assert
		await waitFor(() => {
			expect(result.current.minNotes).toStrictEqual(MIN_NOTES_THREE);
		});
	});

	it("setMaxNotes updates maxNotes", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Act
		result.current.setMaxNotes(MAX_NOTES_FIVE);

		// Assert
		await waitFor(() => {
			expect(result.current.maxNotes).toStrictEqual(MAX_NOTES_FIVE);
		});
	});

	it("setIncludeInversions sets includeInversions to true", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Act
		result.current.setIncludeInversions(true);

		// Assert
		await waitFor(() => {
			expect(result.current.includeInversions).toBe(true);
		});
	});

	it("noteSearchEntries contains 12 chromatic note entries", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.noteSearchEntries).toHaveLength(NOTE_SEARCH_ENTRY_COUNT);
	});

	it("spellingSearchEntries contains 12 chromatic spelling entries", () => {
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		expect(result.current.spellingSearchEntries).toHaveLength(SPELLING_SEARCH_ENTRY_COUNT);
	});

	it("root note entry is required when initialized with C root and letters display mode", () => {
		// computeInitialSelectedRoot with letters mode and songKey "C" → root "C" (semitone 0)
		// noteSearchState initializes to { 0: "required" }, so entry at offset 0 is "required"

		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.noteSearchEntries[ROOT_SEMITONE_OFFSET]?.toggleState).toBe("required");
	});

	it("handleNoteSearchToggle advances root entry from required to excluded", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Act
		result.current.handleNoteSearchToggle(ROOT_SEMITONE_OFFSET);

		// Assert
		await waitFor(() => {
			expect(result.current.noteSearchEntries[ROOT_SEMITONE_OFFSET]?.toggleState).toBe("excluded");
		});
	});

	it("handleNoteSearchToggle advances root entry from excluded to default", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Act — cycle 1: required → excluded
		result.current.handleNoteSearchToggle(ROOT_SEMITONE_OFFSET);
		await waitFor(() => {
			expect(result.current.noteSearchEntries[ROOT_SEMITONE_OFFSET]?.toggleState).toBe("excluded");
		});

		// Act — cycle 2: excluded → default (entry removed from state map)
		result.current.handleNoteSearchToggle(ROOT_SEMITONE_OFFSET);

		// Assert
		await waitFor(() => {
			expect(result.current.noteSearchEntries[ROOT_SEMITONE_OFFSET]?.toggleState).toBe("default");
		});
	});

	it("handleSpellingSearchToggle can exclude shapes containing the perfect fifth spelling", async () => {
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		expect(result.current.displayedShapes.some((shape) => shape.code === MAJOR_SHAPE_CODE)).toBe(true);

		result.current.handleSpellingSearchToggle(PERFECT_FIFTH_SEMITONE_OFFSET);
		await waitFor(() => {
			expect(result.current.spellingSearchEntries[PERFECT_FIFTH_SEMITONE_OFFSET]?.toggleState).toBe(
				"required",
			);
		});

		result.current.handleSpellingSearchToggle(PERFECT_FIFTH_SEMITONE_OFFSET);
		await waitFor(() => {
			expect(result.current.spellingSearchEntries[PERFECT_FIFTH_SEMITONE_OFFSET]?.toggleState).toBe(
				"excluded",
			);
		});

		await waitFor(() => {
			expect(result.current.displayedShapes.some((shape) => shape.code === MAJOR_SHAPE_CODE)).toBe(
				false,
			);
		});
	});

	it("getNoteSearchRoot returns C for a major triad when C is required in note search", () => {
		// Initial noteSearchState: { 0: "required" } (semitone 0 = C).
		// computeAbsoluteSemitones("3,5", rootSemitone=0) = {0, 4, 7}.
		// semitone 0 is required and present → filter passes → returns songKeysBySemitone[0] = "C".

		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.getNoteSearchRoot(MAJOR_TRIAD_SPELLING)).toBe(SONG_KEY_C);
	});

	it("displayedShapes is non-empty with default filters", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.displayedShapes.length).toBeGreaterThanOrEqual(MINIMUM_SHAPE_COUNT);
	});

	it("setQuery narrows displayedShapes to fewer results than the unfiltered list", async () => {
		// Arrange
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));
		const initialCount = result.current.displayedShapes.length;

		// Act
		result.current.setQuery(QUERY_MAJOR);

		// Assert
		await waitFor(() => {
			expect(result.current.displayedShapes.length).toBeLessThan(initialCount);
		});
	});

	it("selectedShape resolves to the major chord when selectedShapeCode is M", () => {
		// Arrange + Act
		const { result } = renderHook(() =>
			useChordSearch({ ...DEFAULT_PARAMS, selectedShapeCode: MAJOR_SHAPE_CODE }),
		);

		// Assert
		expect(result.current.selectedShape?.name).toBe(MAJOR_CHORD_NAME);
	});

	it("allShapeInversions is empty when includeInversions is false", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordSearch(DEFAULT_PARAMS));

		// Assert
		expect(result.current.allShapeInversions).toHaveLength(INVERSION_COUNT_ZERO);
	});

	it("initializes maxNotes to the shape note count derived from the initial chord token", () => {
		// "[C M]" token → shapeCode "M" (major) → noteCount 3 (root + major 3rd + perfect 5th)

		// Arrange + Act
		const { result } = renderHook(() =>
			useChordSearch({ ...DEFAULT_PARAMS, initialChordToken: INITIAL_TOKEN_C_MAJOR }),
		);

		// Assert
		expect(result.current.maxNotes).toStrictEqual(TRIAD_NOTE_COUNT);
	});
});
