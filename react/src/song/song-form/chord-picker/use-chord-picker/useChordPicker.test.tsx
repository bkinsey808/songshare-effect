import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import {
	ChordScaleDegreeDisplay,
	type ChordScaleDegreeDisplayType,
} from "@/shared/user/chordScaleDegreeDisplay";

import useChordPicker from "./useChordPicker";

vi.mock("react-i18next");
vi.mock("@/react/chord-display-mode/useChordDisplayModePreference");

const EMPTY_TEXT = "";
const SONG_KEY_G = "G";
const SEARCH_QUERY_SEVEN = "7";
const MAX_NOTES_THREE = "3";
const SCALE_DEGREE_FORM = "Scale Degree Form";
const LETTER_FORM = "Letter Form";
const UNAVAILABLE_PREVIEW_LABEL = "—";
const DEFAULT_ROOT = "C";
const ROOT_B_FLAT = "Bb";
const ROOT_B_FLAT_LABEL = "Bb";
const ROOT_V = "V";
const ROOT_V_LABEL = "V";
const FIRST_RESULT_INDEX = 0;
const MINIMUM_SECOND_RESULT_INDEX = 1;
const ONE_CALL = 1;

/**
 * Returns the displayed shape code at a specific index for deterministic test assertions.
 *
 * @param displayedShapes - Current displayed chord-shape results
 * @param index - Index to read from the displayed results
 * @returns Shape code at the requested index
 */
function getDisplayedShapeCodeAtIndex(
	displayedShapes: readonly { code: string }[],
	index: number,
): string {
	const shapeCode = displayedShapes[index]?.code;
	if (shapeCode === undefined) {
		throw new Error(`Expected a displayed shape at index ${index}`);
	}

	return shapeCode;
}

/**
 * Configures the mocked chord display preference hook for the requested display mode.
 *
 * @param chordDisplayMode - Effective chord display mode to expose from the hook mock
 * @returns void
 */
function installChordDisplayModeMock(
	chordDisplayMode: "letters" | "german" | "roman" | "sargam" | "solfege",
): void {
	let chordScaleDegreeDisplay: ChordScaleDegreeDisplayType = ChordScaleDegreeDisplay.roman;
	if (chordDisplayMode === ChordDisplayMode.solfege) {
		chordScaleDegreeDisplay = ChordScaleDegreeDisplay.solfege;
	} else if (chordDisplayMode === ChordDisplayMode.sargam) {
		chordScaleDegreeDisplay = ChordScaleDegreeDisplay.sargam;
	}

	vi.mocked(useChordDisplayModePreference).mockReturnValue({
		chordDisplayCategory:
			chordDisplayMode === ChordDisplayMode.letters || chordDisplayMode === ChordDisplayMode.german
				? ChordDisplayCategory.letters
				: ChordDisplayCategory.scaleDegree,
		chordLetterDisplay:
			chordDisplayMode === ChordDisplayMode.german
				? ChordLetterDisplay.german
				: ChordLetterDisplay.standard,
		chordDisplayMode,
		chordScaleDegreeDisplay,
	});
}

type HarnessProps = Readonly<{
	closeChordPicker?: () => void;
	initialChordToken?: string;
	insertChordFromPicker?: (token: string) => void;
	songKey?: "G" | "";
}>;

/**
 * Harness for useChordPicker.
 *
 * Shows how the hook integrates with a picker UI:
 * - a search input for `query`
 * - a select for `maxNotes`
 * - buttons that choose absolute and roman roots
 * - buttons that choose the first and second displayed chord shapes
 * - an insert button wired to `handleInsert`
 * - visible debug fields for all returned state used by the picker view
 */
function Harness({
	closeChordPicker = vi.fn(),
	initialChordToken,
	insertChordFromPicker = vi.fn(),
	songKey = SONG_KEY_G,
}: HarnessProps): ReactElement {
	const {
		alternatePreviewLabel,
		alternatePreviewToken,
		canonicalToken,
		chordDisplayMode,
		displayedShapes,
		handleInsert,
		maxNotes,
		maxNotesInputId,
		previewToken,
		query,
		rootPickerDisplayMode,
		searchInputId,
		selectedRoot,
		selectedShape,
		setMaxNotes,
		setQuery,
		setSelectedRoot,
		setSelectedShapeCode,
	} = useChordPicker({
		closeChordPicker,
		initialChordToken,
		insertChordFromPicker,
		songKey,
	});

	return (
		<div>
			<div data-testid="alternate-preview-label">{alternatePreviewLabel}</div>
			<div data-testid="alternate-preview-token">{alternatePreviewToken}</div>
			<div data-testid="canonical-token">{canonicalToken ?? EMPTY_TEXT}</div>
			<div data-testid="chord-display-mode">{chordDisplayMode}</div>
			<div data-testid="displayed-shape-count">{String(displayedShapes.length)}</div>
			<div data-testid="first-shape-code">
				{displayedShapes[FIRST_RESULT_INDEX]?.code ?? EMPTY_TEXT}
			</div>
			<div data-testid="max-notes-input-id">{maxNotesInputId}</div>
			<div data-testid="max-notes-value">{String(maxNotes)}</div>
			<div data-testid="preview-token">{previewToken}</div>
			<div data-testid="query-value">{query}</div>
			<div data-testid="root-picker-display-mode">{rootPickerDisplayMode}</div>
			<div data-testid="search-input-id">{searchInputId}</div>
			<div data-testid="selected-root-label">{selectedRoot.label}</div>
			<div data-testid="selected-root-type">{selectedRoot.rootType}</div>
			<div data-testid="selected-shape-code">{selectedShape?.code ?? EMPTY_TEXT}</div>
			<div data-testid="selected-shape-name">{selectedShape?.name ?? EMPTY_TEXT}</div>

			<label htmlFor={searchInputId}>Search</label>
			<input
				id={searchInputId}
				data-testid="query-input"
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
				}}
			/>

			<label htmlFor={maxNotesInputId}>Max Notes</label>
			<select
				id={maxNotesInputId}
				data-testid="max-notes-select"
				value={String(maxNotes)}
				onChange={(event) => {
					setMaxNotes(Number(event.target.value));
				}}
			>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="5">5</option>
			</select>

			<button
				type="button"
				data-testid="select-root-bb"
				onClick={() => {
					setSelectedRoot({
						root: ROOT_B_FLAT,
						rootType: "absolute",
						label: ROOT_B_FLAT_LABEL,
					});
				}}
			>
				absolute root
			</button>
			<button
				type="button"
				data-testid="select-root-v"
				onClick={() => {
					setSelectedRoot({
						root: ROOT_V,
						rootType: "roman",
						label: ROOT_V_LABEL,
					});
				}}
			>
				roman root
			</button>
			<button
				type="button"
				data-testid="select-first-shape"
				onClick={() => {
					const firstShapeCode = displayedShapes[FIRST_RESULT_INDEX]?.code;
					if (firstShapeCode !== undefined) {
						setSelectedShapeCode(firstShapeCode);
					}
				}}
			>
				first shape
			</button>
			<button
				type="button"
				data-testid="select-second-shape"
				onClick={() => {
					const secondShapeCode = displayedShapes[MINIMUM_SECOND_RESULT_INDEX]?.code;
					if (secondShapeCode !== undefined) {
						setSelectedShapeCode(secondShapeCode);
					}
				}}
			>
				second shape
			</button>
			<button type="button" data-testid="insert-button" onClick={handleInsert}>
				insert
			</button>
		</div>
	);
}

describe("useChordPicker — Harness", () => {
	it("wires the picker state and handlers into a realistic DOM surface", () => {
		// Arrange
		cleanup();
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);
		const insertChordFromPicker = vi.fn();

		// Act
		render(<Harness songKey={SONG_KEY_G} insertChordFromPicker={insertChordFromPicker} />);
		fireEvent.change(screen.getByTestId("query-input"), {
			target: { value: SEARCH_QUERY_SEVEN },
		});
		fireEvent.click(screen.getByTestId("select-second-shape"));
		fireEvent.change(screen.getByTestId("max-notes-select"), {
			target: { value: MAX_NOTES_THREE },
		});
		fireEvent.click(screen.getByTestId("select-root-bb"));
		fireEvent.click(screen.getByTestId("insert-button"));
		fireEvent.click(screen.getByTestId("select-root-v"));

		// Assert
		expect({
			alternatePreviewLabel: screen.getByTestId("alternate-preview-label").textContent,
			maxNotesValue: screen.getByTestId("max-notes-value").textContent,
			queryValue: screen.getByTestId("query-value").textContent,
			searchInputIdEmpty: screen.getByTestId("search-input-id").textContent === EMPTY_TEXT,
			selectedRootLabel: screen.getByTestId("selected-root-label").textContent,
			selectedRootType: screen.getByTestId("selected-root-type").textContent,
			selectedShapeCodeEmpty: screen.getByTestId("selected-shape-code").textContent === EMPTY_TEXT,
			maxNotesInputIdEmpty: screen.getByTestId("max-notes-input-id").textContent === EMPTY_TEXT,
		}).toStrictEqual({
			alternatePreviewLabel: SCALE_DEGREE_FORM,
			maxNotesInputIdEmpty: false,
			maxNotesValue: MAX_NOTES_THREE,
			queryValue: SEARCH_QUERY_SEVEN,
			searchInputIdEmpty: false,
			selectedRootLabel: ROOT_V_LABEL,
			selectedRootType: "roman",
			selectedShapeCodeEmpty: false,
		});
		expect(insertChordFromPicker).toHaveBeenCalledWith("[bIII d7]");
	});
});

describe("useChordPicker — renderHook", () => {
	it("returns letter-mode previews with the alternate scale-degree form", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);

		// Act
		const { result } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: undefined,
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		// Assert
		expect(result.current.previewToken).toBe("[G M]");
		expect(result.current.alternatePreviewLabel).toBe(SCALE_DEGREE_FORM);
		expect(result.current.alternatePreviewToken).toBe("[I M]");
		expect(result.current.selectedRoot).toStrictEqual({
			root: SONG_KEY_G,
			rootType: "absolute",
			label: SONG_KEY_G,
		});
		expect(result.current.canonicalToken).toBe("[I M]");
	});

	it("does not return a scale-degree alternate preview when the song has no key", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);

		// Act
		const { result } = renderHook(() =>
			useChordPicker({
				songKey: "",
				initialChordToken: "[A M]",
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		// Assert
		expect(result.current.alternatePreviewLabel).toBe(UNAVAILABLE_PREVIEW_LABEL);
		expect(result.current.alternatePreviewToken).toBe(EMPTY_TEXT);
	});

	it("returns scale-degree previews with the alternate letter form", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.roman);

		// Act
		const { result } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: undefined,
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		// Assert
		expect(result.current.previewToken).toBe("[I M]");
		expect(result.current.alternatePreviewLabel).toBe(LETTER_FORM);
		expect(result.current.alternatePreviewToken).toBe("[G M] G B D");
		expect(result.current.selectedRoot).toStrictEqual({
			root: "I",
			rootType: "roman",
			label: "I",
		});
	});

	it("forces the root picker to letters when the song has no key", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.roman);

		// Act
		const { result } = renderHook(() =>
			useChordPicker({
				songKey: "",
				initialChordToken: undefined,
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		// Assert
		expect(result.current.rootPickerDisplayMode).toBe(ChordDisplayMode.letters);
		expect(result.current.selectedRoot).toStrictEqual({
			root: DEFAULT_ROOT,
			rootType: "absolute",
			label: DEFAULT_ROOT,
		});
	});

	it("moves the selected shape to the front of the displayed results", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);
		const { result } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: undefined,
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		// Act
		act(() => {
			result.current.setQuery(SEARCH_QUERY_SEVEN);
		});
		const targetShapeCode = getDisplayedShapeCodeAtIndex(
			result.current.displayedShapes,
			MINIMUM_SECOND_RESULT_INDEX,
		);
		act(() => {
			result.current.setSelectedShapeCode(targetShapeCode);
		});

		// Assert
		expect(result.current.displayedShapes[FIRST_RESULT_INDEX]?.code).toBe(targetShapeCode);
	});

	it("calls insertChordFromPicker with the canonical token", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);
		const insertChordFromPicker = vi.fn();
		const { result } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: undefined,
				closeChordPicker: vi.fn(),
				insertChordFromPicker,
			}),
		);

		// Act
		act(() => {
			result.current.handleInsert();
		});

		// Assert
		expect(insertChordFromPicker).toHaveBeenCalledWith("[I M]");
	});

	it("registers an Escape listener, closes on Escape, and removes the listener on unmount", () => {
		// Arrange
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);
		const closeChordPicker = vi.fn();
		const addSpy = vi.spyOn(document, "addEventListener");
		const removeSpy = vi.spyOn(document, "removeEventListener");

		// Act
		const { unmount } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: undefined,
				closeChordPicker,
				insertChordFromPicker: vi.fn(),
			}),
		);
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		unmount();

		// Assert
		expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
		expect(closeChordPicker).toHaveBeenCalledTimes(ONE_CALL);
		expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

		addSpy.mockRestore();
		removeSpy.mockRestore();
	});
});
