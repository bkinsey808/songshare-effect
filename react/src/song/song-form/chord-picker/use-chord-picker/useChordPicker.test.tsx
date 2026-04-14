import { act, renderHook } from "@testing-library/react";
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
const SCALE_DEGREE_FORM = "Scale Degree Form";
const LETTER_FORM = "Letter Form";
const UNAVAILABLE_PREVIEW_LABEL = "—";
const DEFAULT_ROOT = "C";
const ROOT_ANY_LABEL = "Any";
const ROOT_E_FLAT = "Eb";
const ROOT_E_FLAT_LABEL = "Eb";
const ONE_CALL = 1;
const NOTE_BUTTON_E_FLAT = "Eb";
const NOTE_PICKER_SAMPLE_START = 0;
const NOTE_PICKER_SAMPLE_END = 3;

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

	it("shows a fallback preview chord when the root is any", () => {
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);

		const { result } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: "[C M]",
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		act(() => {
			result.current.setSelectedRoot({
				root: "any",
				rootType: "any",
				label: ROOT_ANY_LABEL,
			});
			result.current.setSelectedShapeCode("-");
		});

		expect(result.current.previewToken).toBe("[C -]");
		expect(result.current.alternatePreviewLabel).toBe(SCALE_DEGREE_FORM);
		expect(result.current.alternatePreviewToken).toBe("[IV -]");
	});

	it("keeps the same note-picker notes when switching from a selected root to any", () => {
		mockUseTranslation();
		installChordDisplayModeMock(ChordDisplayMode.letters);

		const { result } = renderHook(() =>
			useChordPicker({
				songKey: SONG_KEY_G,
				initialChordToken: "[C M]",
				closeChordPicker: vi.fn(),
				insertChordFromPicker: vi.fn(),
			}),
		);

		act(() => {
			result.current.setSelectedRoot({
				root: ROOT_E_FLAT,
				rootType: "absolute",
				label: ROOT_E_FLAT_LABEL,
			});
		});

		const noteLabelsBeforeAny = result.current.notePickerEntries
			.slice(NOTE_PICKER_SAMPLE_START, NOTE_PICKER_SAMPLE_END)
			.map((entry) => entry.letterName);

		act(() => {
			result.current.setSelectedRoot({
				root: "any",
				rootType: "any",
				label: ROOT_ANY_LABEL,
			});
		});

		expect(noteLabelsBeforeAny[NOTE_PICKER_SAMPLE_START]).toBe(NOTE_BUTTON_E_FLAT);
		expect(
			result.current.notePickerEntries
				.slice(NOTE_PICKER_SAMPLE_START, NOTE_PICKER_SAMPLE_END)
				.map((entry) => entry.letterName),
		).toStrictEqual(noteLabelsBeforeAny);
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
