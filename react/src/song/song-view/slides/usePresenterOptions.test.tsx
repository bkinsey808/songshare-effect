import { act, cleanup, fireEvent, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import {
	ChordDisplayMode,
	type ChordDisplayModeType,
} from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import usePresenterOptions from "./usePresenterOptions";

vi.mock("@/react/chord-display-mode/useChordDisplayModePreference");

const LYRICS_FIELD = "lyrics";
const TRANSLATION_FIELD = "translation";
const SCRIPT_FIELD = "script";
const SELECTED_FIELDS_TEST_ID = "selected-fields";
const SHOW_CHORDS_TEST_ID = "show-chords";
const CHORD_DISPLAY_MODE_TEST_ID = "chord-display-mode";
const SHOW_LANGUAGE_TAGS_TEST_ID = "show-language-tags";
const TOGGLE_TRANSLATION_TEST_ID = "toggle-translation";
const TOGGLE_CHORDS_TEST_ID = "toggle-chords";
const SET_ROMAN_MODE_TEST_ID = "set-roman-mode";
const TOGGLE_LANGUAGE_TAGS_TEST_ID = "toggle-language-tags";
const TRUE_TEXT = "true";
const FALSE_TEXT = "false";

type HookProps = Readonly<{
	availableFields: readonly string[];
}>;

/**
 * Install a mocked chord display mode preference for tests.
 *
 * @param chordDisplayMode - Effective chord display mode returned by the dependency hook
 * @returns void
 */
function installChordDisplayModePreferenceMock(
	chordDisplayMode: ChordDisplayModeType = ChordDisplayMode.letters,
): void {
	vi.resetAllMocks();
	vi.mocked(useChordDisplayModePreference).mockReturnValue({
		chordDisplayCategory: ChordDisplayCategory.letters,
		chordLetterDisplay: ChordLetterDisplay.standard,
		chordDisplayMode,
		chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
	});
}

/**
 * Harness for `usePresenterOptions`.
 *
 * Shows how presenter option handlers wire into UI controls:
 * - selected fields render as a comma-separated summary
 * - buttons toggle field, chord visibility, and language-tag visibility
 * - a button applies an explicit chord display mode
 *
 * @param availableFields - Field keys available for presentation controls
 * @returns ReactElement rendering the hook outputs for assertions
 */
function Harness({ availableFields }: { availableFields: readonly string[] }): ReactElement {
	const {
		selectedFields,
		showChords,
		chordDisplayMode,
		showLanguageTags,
		toggleField,
		toggleChords,
		setChordDisplayMode,
		toggleLanguageTags,
	} = usePresenterOptions({ availableFields });

	return (
		<div>
			<div data-testid={SELECTED_FIELDS_TEST_ID}>{selectedFields.join(",")}</div>
			<div data-testid={SHOW_CHORDS_TEST_ID}>{String(showChords)}</div>
			<div data-testid={CHORD_DISPLAY_MODE_TEST_ID}>{chordDisplayMode}</div>
			<div data-testid={SHOW_LANGUAGE_TAGS_TEST_ID}>{String(showLanguageTags)}</div>
			<button
				type="button"
				data-testid={TOGGLE_TRANSLATION_TEST_ID}
				onClick={() => {
					toggleField(TRANSLATION_FIELD);
				}}
			>
				Toggle translation
			</button>
			<button
				type="button"
				data-testid={TOGGLE_CHORDS_TEST_ID}
				onClick={() => {
					toggleChords();
				}}
			>
				Toggle chords
			</button>
			<button
				type="button"
				data-testid={SET_ROMAN_MODE_TEST_ID}
				onClick={() => {
					setChordDisplayMode(ChordDisplayMode.roman);
				}}
			>
				Set roman mode
			</button>
			<button
				type="button"
				data-testid={TOGGLE_LANGUAGE_TAGS_TEST_ID}
				onClick={() => {
					toggleLanguageTags();
				}}
			>
				Toggle language tags
			</button>
		</div>
	);
}

describe("usePresenterOptions — Harness", () => {
	it("wires presenter option handlers through real UI controls", () => {
		// Arrange
		cleanup();
		installChordDisplayModePreferenceMock(ChordDisplayMode.german);
		const { getByTestId } = render(<Harness availableFields={[LYRICS_FIELD, TRANSLATION_FIELD]} />);

		// Act
		fireEvent.click(getByTestId(TOGGLE_TRANSLATION_TEST_ID));
		fireEvent.click(getByTestId(TOGGLE_CHORDS_TEST_ID));
		fireEvent.click(getByTestId(SET_ROMAN_MODE_TEST_ID));
		fireEvent.click(getByTestId(TOGGLE_LANGUAGE_TAGS_TEST_ID));

		// Assert
		expect({
			chordDisplayMode: getByTestId(CHORD_DISPLAY_MODE_TEST_ID).textContent,
			selectedFields: getByTestId(SELECTED_FIELDS_TEST_ID).textContent,
			showChords: getByTestId(SHOW_CHORDS_TEST_ID).textContent,
			showLanguageTags: getByTestId(SHOW_LANGUAGE_TAGS_TEST_ID).textContent,
		}).toStrictEqual({
			chordDisplayMode: ChordDisplayMode.roman,
			selectedFields: LYRICS_FIELD,
			showChords: FALSE_TEXT,
			showLanguageTags: TRUE_TEXT,
		});
	});
});

describe("usePresenterOptions — renderHook", () => {
	it("initializes all fields and local defaults from the global chord preference", () => {
		// Arrange
		installChordDisplayModePreferenceMock(ChordDisplayMode.solfege);

		// Act
		const { result } = renderHook(() =>
			usePresenterOptions({ availableFields: [LYRICS_FIELD, TRANSLATION_FIELD] }),
		);

		// Assert
		expect(result.current.selectedFields).toStrictEqual([LYRICS_FIELD, TRANSLATION_FIELD]);
		expect(result.current.showChords).toBe(true);
		expect(result.current.chordDisplayMode).toBe(ChordDisplayMode.solfege);
		expect(result.current.showLanguageTags).toBe(false);
	});

	it("toggles local presenter state and allows explicit chord mode changes", () => {
		// Arrange
		installChordDisplayModePreferenceMock(ChordDisplayMode.letters);
		const { result } = renderHook(() =>
			usePresenterOptions({ availableFields: [LYRICS_FIELD, TRANSLATION_FIELD] }),
		);

		// Act — cycle 1
		act(() => {
			result.current.toggleField(TRANSLATION_FIELD);
			result.current.toggleChords();
			result.current.setChordDisplayMode(ChordDisplayMode.roman);
			result.current.toggleLanguageTags();
		});

		// Act — cycle 2
		act(() => {
			result.current.toggleField(TRANSLATION_FIELD);
		});

		// Assert
		expect(result.current.selectedFields).toStrictEqual([LYRICS_FIELD, TRANSLATION_FIELD]);
		expect(result.current.showChords).toBe(false);
		expect(result.current.chordDisplayMode).toBe(ChordDisplayMode.roman);
		expect(result.current.showLanguageTags).toBe(true);
	});

	it("reconciles selected fields when the available field list changes", () => {
		// Arrange
		installChordDisplayModePreferenceMock(ChordDisplayMode.german);
		const { result, rerender } = renderHook(
			({ availableFields }: HookProps) => usePresenterOptions({ availableFields }),
			{
				initialProps: {
					availableFields: [LYRICS_FIELD, TRANSLATION_FIELD],
				},
			},
		);

		// Act — cycle 1
		act(() => {
			result.current.toggleField(TRANSLATION_FIELD);
			result.current.setChordDisplayMode(ChordDisplayMode.roman);
		});

		// Act — cycle 2
		act(() => {
			rerender({
				availableFields: [LYRICS_FIELD, SCRIPT_FIELD],
			});
		});

		// Assert
		expect(result.current.selectedFields).toStrictEqual([LYRICS_FIELD, SCRIPT_FIELD]);
		expect(result.current.chordDisplayMode).toBe(ChordDisplayMode.roman);
		expect(result.current.showChords).toBe(true);
		expect(result.current.showLanguageTags).toBe(false);
	});
});
