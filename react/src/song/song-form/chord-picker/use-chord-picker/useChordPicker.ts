import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import { type ChordShape } from "@/shared/music/chord-shapes";
import { type SongKey } from "@/shared/song/songKeyOptions";
import { type ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import { OCTAVE_SEMITONE_COUNT } from "../chordPickerConstants";
import type { NotePickerEntry } from "../note-picker/NotePicker";
import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import getInitialSelectedRoot from "../root-picker/getInitialSelectedRoot";
import computeAlternatePreview from "./computeAlternatePreview";
import computeDisplayedShapes from "./computeDisplayedShapes";
import computeNotePickerEntries from "./computeNotePickerEntries";
import computeRootPickerDisplayMode from "./computeRootPickerDisplayMode";
import computeShapeAfterNoteToggle from "./computeShapeAfterNoteToggle";
import findShapeByInversion from "./findShapeByInversion";
import getCanonicalRootAndShape from "./getCanonicalRootAndShape";
import getCanonicalToken from "./getCanonicalToken";
import type { ChordInversion } from "./getChordInversions";
import getInitialMaxNotes from "./getInitialMaxNotes";
import getInitialShapeCode from "./getInitialShapeCode";
import useChordInversions from "./useChordInversions";
import useEscapeToClose from "./useEscapeToClose";

const ROOT_SEMITONE_OFFSET = 0;
/** Synthetic shapes produced by computeShapeAfterNoteToggle always use id=0; catalog shapes use positive ids. */
const SYNTHETIC_CHORD_ID = 0;
/** Root counts as one note in addition to the non-root intervals in a spelling. */
const ROOT_NOTE_COUNT = 1;

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
	inversionBaseShapeName: string;
	inversionPreviewTokens: ReadonlyMap<SongKey, string>;
	inversionSlashPreviewTokens: ReadonlyMap<SongKey, string>;
	slashPreviewToken: string;
	slashPreviewShapeName: string;
	previewShapeSpelling: string;
	displayedShapes: readonly ChordShape[];
	handleInsert: () => void;
	handleNoteToggle: (semitoneOffset: number) => void;
	handleSelectInversion: (inversion: ChordInversion) => void;
	isShapeSelected: (shapeId: number) => boolean;
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
	const [maxNotes, setMaxNotes] = useState(() => getInitialMaxNotes({ initialChordToken }));
	const [selectedShapeCode, setSelectedShapeCode] = useState(() =>
		getInitialShapeCode({ initialChordToken }),
	);
	const searchInputId = useId();
	const maxNotesInputId = useId();
	const { displayedShapes, selectedShape } = computeDisplayedShapes({
		query,
		maxNotes,
		selectedShapeCode,
	});

	const {
		selectedBassNote,
		absoluteRoot,
		activeInversion,
		inversionBaseShape,
		inversionBaseShapeName,
		displayChordInversions,
		displayInversionPreviewTokens,
		slashPreviewTokens,
		handleSelectInversion,
		clearInversion,
		selectBassNote,
	} = useChordInversions({
		selectedRoot,
		setSelectedRoot,
		selectedShapeCode,
		onShapeCodeChange: setSelectedShapeCode,
		songKey,
		chordDisplayMode,
		initialChordToken,
	});

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
			: transformChordTextForDisplay(canonicalToken, { chordDisplayMode, songKey });
	const { alternatePreviewLabel, alternatePreviewToken } = computeAlternatePreview({
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		songKey,
		canonicalToken,
		selectedRoot,
		selectedShape,
		selectedBassNote,
		t,
	});

	// Use the pre-inversion base shape for toggle logic (interval positions come from the
	// chord root). When an inversion is active, display the note picker from the bass note's
	// perspective so the interval labels match the re-rooted spelling (e.g. 4,b6 for 2nd
	// inversion). The active intervals (from activeInversion.reRootedSpelling) are also
	// relative to the bass note, so absolute root and spelling stay consistent.
	const notePickerShape = inversionBaseShape ?? selectedShape;
	const notePickerRoot = selectedBassNote ?? absoluteRoot;
	const notePickerEntries = computeNotePickerEntries({
		selectedBassNote: undefined,
		absoluteRoot: notePickerRoot,
		activeInversion,
		selectedShape: notePickerShape,
	});

	/**
	 * Toggles a non-root note interval in or out of the selected chord shape.
	 *
	 * 1. Direct catalog match → select that shape.
	 * 2. Inversion match → re-root to the catalog shape's root and set the original root as bass
	 *    (produces a slash chord token).
	 * 3. No catalog or inversion match → use a synthetic shape with the spelling as its code
	 *    so the note picker reflects the current selection even without a named chord.
	 *
	 * When an inversion card is active the toggle works in the bass-note (display root) frame
	 * so the note picker stays anchored — only the clicked note appears to change, not the
	 * entire perspective.
	 *
	 * @param semitoneOffset - The chromatic position to toggle (0 = root, always ignored)
	 * @returns void
	 */
	function handleNoteToggle(semitoneOffset: number): void {
		// Offset 0 is always the displayed root (chord root or bass note) and is never toggleable.
		if (semitoneOffset === ROOT_SEMITONE_OFFSET) {
			return;
		}

		// When an inversion card is active, build a temporary working shape from the re-rooted
		// spelling (bass-note frame) instead of the base shape (chord-root frame). This ensures
		// the toggled interval corresponds exactly to what the user sees and that the note
		// picker stays anchored to the bass note after the operation.
		const isInversionActive = activeInversion !== undefined;
		const workingShape = isInversionActive
			? ({
					id: 0,
					name: activeInversion.reRootedSpelling,
					code: activeInversion.reRootedSpelling,
					prefer: false,
					noteCount: activeInversion.reRootedSpelling.split(",").length + ROOT_NOTE_COUNT,
					spelling: activeInversion.reRootedSpelling,
					ordering: 0,
					intervalForm: "",
					altNames: "",
					searchText: activeInversion.reRootedSpelling,
				} as const)
			: notePickerShape;

		const toggleResult = computeShapeAfterNoteToggle({
			selectedShape: workingShape,
			semitoneOffset,
		});
		if (toggleResult === undefined) {
			return;
		}

		// The reference root for inversion matching is always the display root — the note
		// picker's anchor note (bass note when inversion active, chord root otherwise).
		const referenceRoot = notePickerRoot;

		// Synthetic shapes created by computeShapeAfterNoteToggle always have id=0.
		// Real catalog shapes always have a positive id.
		if (toggleResult.id === SYNTHETIC_CHORD_ID && referenceRoot !== undefined) {
			const inversionMatch = findShapeByInversion(toggleResult.spelling);
			if (inversionMatch !== undefined) {
				const newRootSemitone =
					(rootSemitoneMap[referenceRoot] + inversionMatch.inversionRootOffset) %
					OCTAVE_SEMITONE_COUNT;
				const newAbsoluteRoot = songKeysBySemitone[newRootSemitone];
				if (newAbsoluteRoot !== undefined) {
					clearInversion();
					setSelectedRoot({
						root: newAbsoluteRoot,
						rootType: "absolute",
						label: newAbsoluteRoot,
					});
					setSelectedShapeCode(inversionMatch.shape.code);
					selectBassNote(referenceRoot);
					return;
				}
			}
		}

		// Catalog match or no inversion match:
		// When an inversion was active, promote the display root (bass note) to chord root
		// so the note picker perspective stays anchored after the toggle.
		clearInversion();
		if (isInversionActive && referenceRoot !== undefined && referenceRoot !== absoluteRoot) {
			setSelectedRoot({ root: referenceRoot, rootType: "absolute", label: referenceRoot });
		}
		setSelectedShapeCode(toggleResult.code);
	}

	// Close the routed picker when Escape is pressed so keyboard users can cancel quickly.
	useEscapeToClose(closeChordPicker);

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

	// When an inversion is active, display the bass note as the root in the root picker.
	const effectiveDisplayRoot: SelectedRoot =
		selectedBassNote === undefined
			? selectedRoot
			: { root: selectedBassNote, rootType: "absolute", label: selectedBassNote };

	const slashPreviewToken =
		selectedBassNote !== undefined && activeInversion?.matchedShape !== undefined
			? (slashPreviewTokens.get(selectedBassNote) ?? "")
			: "";
	const slashPreviewShapeName =
		selectedBassNote !== undefined && activeInversion?.matchedShape !== undefined
			? inversionBaseShapeName
			: "";

	// For pure slash chords, show the re-rooted spelling (e.g. 4,b6 for A-/E) rather than
	// the base chord's spelling (b3,5), since the bass perspective is what matters.
	const previewShapeSpelling =
		selectedBassNote !== undefined && activeInversion?.matchedShape === undefined
			? (activeInversion?.reRootedSpelling ?? selectedShape?.spelling ?? "")
			: (selectedShape?.spelling ?? "");

	function isShapeSelected(shapeId: number): boolean {
		return (
			selectedShape?.id === shapeId &&
			(selectedBassNote === undefined || activeInversion?.matchedShape !== undefined)
		);
	}

	return {
		alternatePreviewLabel,
		alternatePreviewToken,
		canonicalToken,
		chordDisplayCategory,
		chordDisplayMode,
		chordInversions: displayChordInversions,
		inversionBaseShapeName,
		displayedShapes,
		inversionPreviewTokens: displayInversionPreviewTokens,
		inversionSlashPreviewTokens: slashPreviewTokens,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
		handleInsert,
		handleNoteToggle,
		handleSelectInversion,
		isShapeSelected,
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
			clearInversion();
			setSelectedRoot(nextRoot);
		},
		setSelectedShapeCode: (shapeCode: string): void => {
			clearInversion();
			setSelectedShapeCode(shapeCode);
		},
	};
}
