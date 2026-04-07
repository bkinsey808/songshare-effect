import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import { type ChordShape } from "@/shared/music/chord-shapes";
import { type SongKey } from "@/shared/song/songKeyOptions";
import { type ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import type { NotePickerEntry } from "../note-picker/NotePicker";
import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import getInitialSelectedRoot from "../root-picker/getInitialSelectedRoot";
import computeDisplayedShapes from "./computeDisplayedShapes";
import computeNotePickerEntries from "./computeNotePickerEntries";
import computePreviewValues from "./computePreviewValues";
import computeRootPickerDisplayMode from "./computeRootPickerDisplayMode";
import createNoteToggleHandler from "./createNoteToggleHandler";
import getCanonicalRootAndShape from "./getCanonicalRootAndShape";
import getCanonicalToken from "./getCanonicalToken";
import type { ChordInversion } from "./getChordInversions";
import getInitialMaxNotes from "./getInitialMaxNotes";
import getInitialShapeCode from "./getInitialShapeCode";
import useChordInversions from "./useChordInversions";
import useEscapeToClose from "./useEscapeToClose";

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

	const handleNoteToggle = createNoteToggleHandler({
		activeInversion,
		notePickerShape,
		notePickerRoot,
		absoluteRoot,
		clearInversion,
		setSelectedRoot,
		setSelectedShapeCode,
		selectBassNote,
	});

	// Close the routed picker when Escape is pressed so keyboard users can cancel quickly.
	useEscapeToClose(closeChordPicker);

	function handleInsert(): void {
		if (canonicalToken === undefined) {
			return;
		}
		insertChordFromPicker(canonicalToken);
	}

	const {
		previewToken,
		alternatePreviewLabel,
		alternatePreviewToken,
		effectiveDisplayRoot,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
	} = computePreviewValues({
		canonicalToken,
		selectedBassNote,
		activeInversion,
		selectedShape,
		selectedRoot,
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		songKey,
		chordDisplayMode,
		inversionBaseShapeName,
		slashPreviewTokens,
		t,
	});

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
