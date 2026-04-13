import { useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import { type SciInversion } from "@/react/music/inversions/computeSciInversions";
import type {
	DirectShapeOrdinal,
	ShapeInversion,
} from "@/react/music/inversions/shape-inversion.type";
import computeNotePickerEntries from "@/react/music/note-picker/computeNotePickerEntries";
import type { NotePickerEntry } from "@/react/music/note-picker/NotePickerEntry.type";
import type { NoteSearchEntry } from "@/react/music/note-picker/NoteSearchEntry.type";
import computePreviewSelectedRoot from "@/react/music/preview/computePreviewSelectedRoot";
import computePreviewValues from "@/react/music/preview/computePreviewValues";
import computeAbsoluteSelectedRoot from "@/react/music/root-picker/computeAbsoluteSelectedRoot";
import computeInitialSelectedRoot from "@/react/music/root-picker/computeInitialSelectedRoot";
import computeRootPickerDisplayMode from "@/react/music/root-picker/computeRootPickerDisplayMode";
import DEFAULT_ROOT from "@/react/music/root-picker/defaultRoot";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import computeCanonicalRootAndShape from "@/react/music/sci/computeCanonicalRootAndShape";
import computeCanonicalToken from "@/react/music/sci/computeCanonicalToken";
import computeInitialShapeCode from "@/react/music/sci/computeInitialShapeCode";
import type { ChordShape } from "@/shared/music/chord-shapes";
import { type SongKey } from "@/shared/song/songKeyOptions";
import { type ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import createNoteToggleHandler from "./createNoteToggleHandler";
import useSciInversions from "./useChordInversions";
import useChordSearch from "./useChordSearch";
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
	chordInversions: readonly SciInversion[];
	inversionBaseShapeName: string;
	inversionPreviewTokens: ReadonlyMap<SongKey, string>;
	inversionSlashPreviewTokens: ReadonlyMap<SongKey, string>;
	slashPreviewToken: string;
	slashPreviewShapeName: string;
	previewShapeSpelling: string;
	allShapeInversions: readonly ShapeInversion[];
	directShapeOrdinals: ReadonlyMap<string, DirectShapeOrdinal>;
	displayedShapes: readonly ChordShape[];
	absoluteRoot: SongKey | undefined;
	handleInsert: () => void;
	handleNoteToggle: (semitoneOffset: number) => void;
	handleSpellingSearchToggle: (semitoneOffset: number) => void;
	handleNoteSearchToggle: (semitoneOffset: number) => void;
	getNoteSearchRoot: (spelling: string) => SongKey | undefined;
	handleSelectInversion: (inversion: SciInversion) => void;
	handleSelectShapeInversion: (sourceShapeCode: string, inversion: SciInversion) => void;
	includeInversions: boolean;
	includeInversionsInputId: string;
	isShapeSelected: (shapeId: number) => boolean;
	selectedBassNote: SongKey | undefined;
	minNotes: number;
	minNotesInputId: string;
	maxNotes: number;
	maxNotesInputId: string;
	notePickerEntries: readonly NotePickerEntry[];
	spellingSearchEntries: readonly NoteSearchEntry[];
	noteSearchEntries: readonly NoteSearchEntry[];
	previewToken: string;
	query: string;
	rootPickerDisplayMode: ChordDisplayModeType;
	searchInputId: string;
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	setMinNotes: (value: number) => void;
	setMaxNotes: (value: number) => void;
	setQuery: (value: string) => void;
	setIncludeInversions: (value: boolean) => void;
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
	function getInitialSelectedRoot(): SelectedRoot {
		return computeInitialSelectedRoot({
			chordDisplayMode: rootPickerDisplayMode,
			initialChordToken,
			songKey,
		});
	}
	const [selectedRoot, setSelectedRootState] = useState<SelectedRoot>(getInitialSelectedRoot);
	const [anyRootFallback, setAnyRootFallback] = useState<SongKey>(() => {
		const initialAbsoluteRoot = computeAbsoluteSelectedRoot(getInitialSelectedRoot(), songKey);
		return initialAbsoluteRoot ?? DEFAULT_ROOT;
	});
	const [selectedShapeCode, setSelectedShapeCode] = useState(() =>
		computeInitialShapeCode({ initialChordToken }),
	);

	const {
		selectedBassNote,
		absoluteRoot,
		activeInversion,
		inversionBaseShape,
		inversionBaseShapeName,
		displaySciInversions,
		displayInversionPreviewTokens,
		slashPreviewTokens,
		handleSelectInversion,
		handleSelectShapeInversion,
		clearInversion,
		selectBassNote,
	} = useSciInversions({
		selectedRoot,
		setSelectedRoot: setSelectedRootState,
		selectedShapeCode,
		onShapeCodeChange: setSelectedShapeCode,
		songKey,
		chordDisplayMode,
		initialChordToken,
	});

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

	const { root: canonicalRoot, shapeCode: canonicalShapeCode } = computeCanonicalRootAndShape({
		selectedRoot,
		selectedShape,
		selectedBassNote,
		activeInversion,
	});
	const effectiveCanonicalRoot = computePreviewSelectedRoot(canonicalRoot, anyRootFallback);
	const canonicalToken = computeCanonicalToken({
		selectedRoot: effectiveCanonicalRoot,
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
		fallbackLetterRoot: selectedRoot.rootType === "any" ? anyRootFallback : undefined,
		activeInversion,
		selectedShape: notePickerShape,
	});

	const handleNoteToggle = createNoteToggleHandler({
		activeInversion,
		notePickerShape,
		notePickerRoot,
		absoluteRoot,
		clearInversion,
		setSelectedRoot: setSelectedRootState,
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
		fallbackPreviewRoot: anyRootFallback,
		t,
	});

	function isShapeSelected(shapeId: number): boolean {
		return (
			selectedShape?.id === shapeId &&
			(selectedBassNote === undefined || activeInversion?.matchedShape !== undefined)
		);
	}

	return {
		getNoteSearchRoot,
		allShapeInversions,
		directShapeOrdinals,
		alternatePreviewLabel,
		alternatePreviewToken,
		canonicalToken,
		chordDisplayCategory,
		chordDisplayMode,
		chordInversions: displaySciInversions,
		inversionBaseShapeName,
		displayedShapes,
		inversionPreviewTokens: displayInversionPreviewTokens,
		inversionSlashPreviewTokens: slashPreviewTokens,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
		absoluteRoot,
		handleInsert,
		handleNoteToggle,
		handleSpellingSearchToggle,
		handleNoteSearchToggle,
		handleSelectInversion,
		handleSelectShapeInversion,
		includeInversions,
		includeInversionsInputId,
		isShapeSelected,
		minNotes,
		minNotesInputId,
		maxNotes,
		maxNotesInputId,
		notePickerEntries,
		spellingSearchEntries,
		noteSearchEntries,
		previewToken,
		query,
		rootPickerDisplayMode,
		searchInputId,
		selectedRoot: effectiveDisplayRoot,
		selectedShape,
		setMinNotes,
		setMaxNotes,
		setQuery,
		setIncludeInversions,
		selectedBassNote,
		setSelectedRoot: (nextRoot: SelectedRoot): void => {
			clearInversion();
			if (nextRoot.rootType === "any") {
				setAnyRootFallback(notePickerRoot ?? absoluteRoot ?? anyRootFallback);
			} else {
				const nextAbsoluteRoot = computeAbsoluteSelectedRoot(nextRoot, songKey);
				if (nextAbsoluteRoot !== undefined) {
					setAnyRootFallback(nextAbsoluteRoot);
				}
			}
			setSelectedRootState(nextRoot);
		},
		setSelectedShapeCode: (shapeCode: string): void => {
			clearInversion();
			setSelectedShapeCode(shapeCode);
		},
	};
}
