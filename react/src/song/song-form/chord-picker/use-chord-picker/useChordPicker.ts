import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";
import { type SongKey } from "@/shared/song/songKeyOptions";
import { type ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";


import type { NotePickerEntry } from "../note-picker/NotePicker";
import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import getInitialSelectedRoot from "../root-picker/getInitialSelectedRoot";
import computeAlternatePreview from "./computeAlternatePreview";
import computeDisplayedShapes from "./computeDisplayedShapes";
import computeNotePickerEntries from "./computeNotePickerEntries";
import computeRootPickerDisplayMode from "./computeRootPickerDisplayMode";
import computeShapeAfterNoteToggle from "./computeShapeAfterNoteToggle";
import getAbsoluteSelectedRoot from "./getAbsoluteSelectedRoot";
import getCanonicalRootAndShape from "./getCanonicalRootAndShape";
import getCanonicalToken from "./getCanonicalToken";
import getChordInversions, { type ChordInversion } from "./getChordInversions";
import getInitialBassNote from "./getInitialBassNote";
import getInitialMaxNotes from "./getInitialMaxNotes";
import getInitialShapeCode from "./getInitialShapeCode";
import getInversionPreviewTokens from "./getInversionPreviewTokens";
import useEscapeToClose from "./useEscapeToClose";
import useSongKeyRootSync from "./useSongKeyRootSync";



type UseChordPickerParams = Readonly<{
	songKey: SongKey | "";
	initialChordToken: string | undefined;
	closeChordPicker: () => void;
	insertChordFromPicker: (token: string) => void;
}>;

type UseChordPickerResult = Readonly<{
	alternatePreviewLabel: string;
	alternatePreviewToken: string;
	canonicalToken: string | undefined;
	chordDisplayCategory: ChordDisplayCategoryType;
	chordDisplayMode: ReturnType<typeof useChordDisplayModePreference>["chordDisplayMode"];
	chordInversions: readonly ChordInversion[];
	inversionPreviewTokens: ReadonlyMap<SongKey, string>;
	displayedShapes: readonly ChordShape[];
	handleInsert: () => void;
	handleNoteToggle: (semitoneOffset: number) => void;
	handleSelectInversion: (inversion: ChordInversion) => void;
	selectedBassNote: SongKey | undefined;
	maxNotes: number;
	maxNotesInputId: string;
	notePickerEntries: readonly NotePickerEntry[];
	previewToken: string;
	query: string;
	rootPickerDisplayMode: ChordDisplayModeType;
	searchInputId: string;
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	setMaxNotes: (value: number) => void;
	setQuery: (value: string) => void;
	setSelectedRoot: (nextRoot: SelectedRoot) => void;
	setSelectedShapeCode: (shapeCode: string) => void;
}>;

/**
 * Manages state and derived preview values for the chord picker.
 *
 * @param songKey - Current song key used for display and roman-degree conversion
 * @param initialChordToken - Existing chord token when editing a previously inserted chord
 * @param closeChordPicker - Closes the picker overlay
 * @param insertChordFromPicker - Inserts the chosen canonical chord token into the editor
 * @returns Picker state, derived previews, and handlers
 */
export default function useChordPicker({
	songKey,
	initialChordToken,
	closeChordPicker,
	insertChordFromPicker,
}: UseChordPickerParams): UseChordPickerResult {
	const { t } = useTranslation();
	const { chordDisplayCategory, chordDisplayMode, chordLetterDisplay, chordScaleDegreeDisplay } =
		useChordDisplayModePreference();
	const rootPickerDisplayMode = computeRootPickerDisplayMode({
		chordDisplayCategory,
		songKey,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		chordDisplayMode,
	});
	const [selectedRoot, setSelectedRoot] = useState<SelectedRoot>(() =>
		getInitialSelectedRoot({
			chordDisplayMode: rootPickerDisplayMode,
			initialChordToken,
			songKey,
		}),
	);
	const [query, setQuery] = useState("");
	const [maxNotes, setMaxNotes] = useState(() =>
		getInitialMaxNotes({
			initialChordToken,
		}),
	);
	const [selectedShapeCode, setSelectedShapeCode] = useState(() =>
		getInitialShapeCode({
			initialChordToken,
		}),
	);
	// Remembers the shape code before an inversion is selected so it can be restored on deselect.
	const [inversionBaseShapeCode, setInversionBaseShapeCode] = useState<string | undefined>(undefined);
	const [selectedBassNote, setSelectedBassNote] = useState<SongKey | undefined>(() =>
		getInitialBassNote({ initialChordToken }),
	);
	const searchInputId = useId();
	const maxNotesInputId = useId();
	const { displayedShapes, selectedShape } = computeDisplayedShapes({ query, maxNotes, selectedShapeCode });

	// Compute inversions early from the original (pre-inversion) shape so the list stays stable
	// even when a matched SCI shape is applied to selectedShapeCode.
	const absoluteRoot = getAbsoluteSelectedRoot(selectedRoot, songKey);
	const inversionBaseShape = getChordShapeByCode(inversionBaseShapeCode ?? selectedShapeCode);
	const chordInversions =
		absoluteRoot !== undefined && inversionBaseShape !== undefined
			? getChordInversions(absoluteRoot, inversionBaseShape.code)
			: [];
	const activeInversion =
		selectedBassNote === undefined
			? undefined
			: chordInversions.find((inv) => inv.bassRoot === selectedBassNote);
	const inversionPreviewTokens = getInversionPreviewTokens(
		{ inversions: chordInversions, selectedRoot, inversionBaseShape, songKey, chordDisplayMode });

	// When the active inversion maps to a known SCI shape, store it as [bassNote matchedCode]
	// rather than slash notation so the token round-trips cleanly.
	const { root: canonicalRoot, shapeCode: canonicalShapeCode } = getCanonicalRootAndShape({
		selectedRoot,
		selectedShape,
		selectedBassNote,
		activeInversion,
	});
	const canonicalToken = getCanonicalToken({
		selectedRoot: canonicalRoot,
		selectedShapeCode: canonicalShapeCode,
		songKey,
	});
	const previewToken =
		canonicalToken === undefined
			? ""
			: transformChordTextForDisplay(canonicalToken, {
					chordDisplayMode,
					songKey,
				});
	const { alternatePreviewLabel, alternatePreviewToken } = computeAlternatePreview({
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		songKey,
		canonicalToken,
		selectedRoot,
		selectedShape,
		t,
	});

	// Compute the 12 chromatic note entries (relative to chord root) for the note picker.
	// When an inversion is active, show note letter names relative to the bass note.
	const notePickerEntries = computeNotePickerEntries({
		selectedBassNote,
		absoluteRoot,
		activeInversion,
		selectedShape,
	});

	/**
	 * Toggles a non-root note interval in or out of the selected chord shape.
	 * If the resulting set of intervals matches a known chord shape, that shape is selected.
	 *
	 * @param semitoneOffset - The chromatic position to toggle (0 = root, always ignored)
	 * @returns void
	 */
	function handleNoteToggle(semitoneOffset: number): void {
		const matchingShape = computeShapeAfterNoteToggle({ selectedShape, semitoneOffset });
		if (matchingShape !== undefined) {
			setSelectedBassNote(undefined);
			setSelectedShapeCode(matchingShape.code);
		}
	}

	// Close the routed picker when Escape is pressed so keyboard users can cancel quickly.
	useEscapeToClose(closeChordPicker);

	// When the song key is cleared, convert any selected roman root back to an absolute note.
	useSongKeyRootSync({
		selectedRoot,
		songKey,
		setSelectedRoot,
		setSelectedBassNote,
	});

	/**
	 * Inserts the current canonical token when the selection is complete.
	 *
	 * @returns void
	 */
	function handleInsert(): void {
		if (canonicalToken === undefined) {
			return;
		}
		insertChordFromPicker(canonicalToken);
	}

	/**
	 * Selects an inversion by setting the bass note, keeping the picker open.
	 *
	 * @param inversion - The inversion to select
	 * @returns void
	 */
	function handleSelectInversion(inversion: ChordInversion): void {
		if (selectedBassNote === inversion.bassRoot) {
			// Deselect: restore the original shape code.
			if (inversionBaseShapeCode !== undefined) {
				setSelectedShapeCode(inversionBaseShapeCode);
			}
			setSelectedBassNote(undefined);
			setInversionBaseShapeCode(undefined);
			return;
		}
		// Select: remember the current shape, switch to matched shape if available.
		setInversionBaseShapeCode(selectedShapeCode);
		setSelectedBassNote(inversion.bassRoot);
		if (inversion.matchedShape !== undefined) {
			setSelectedShapeCode(inversion.matchedShape.code);
		}
	}

	// When an inversion is active, display the bass note as the root in the root picker.
	const effectiveDisplayRoot: SelectedRoot =
		selectedBassNote === undefined
			? selectedRoot
			: { root: selectedBassNote, rootType: "absolute", label: selectedBassNote };

	return {
		alternatePreviewLabel,
		alternatePreviewToken,
		canonicalToken,
		chordDisplayCategory,
		chordDisplayMode,
		chordInversions,
		displayedShapes,
		inversionPreviewTokens,
		handleInsert,
		handleNoteToggle,
		handleSelectInversion,
		maxNotes,
		maxNotesInputId,
		notePickerEntries,
		previewToken,
		query,
		rootPickerDisplayMode,
		searchInputId,
		selectedRoot: effectiveDisplayRoot,
		selectedShape,
		setMaxNotes,
		setQuery,
		selectedBassNote,
		setSelectedRoot: (nextRoot: SelectedRoot): void => {
			setSelectedBassNote(undefined);
			setInversionBaseShapeCode(undefined);
			setSelectedRoot(nextRoot);
		},
		setSelectedShapeCode: (shapeCode: string): void => {
			setSelectedBassNote(undefined);
			setInversionBaseShapeCode(undefined);
			setSelectedShapeCode(shapeCode);
		},
	};
}
