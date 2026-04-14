import { useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import { type SciInversion } from "@/react/music/inversions/computeSciInversions";
import computeNotePickerEntries from "@/react/music/note-picker/computeNotePickerEntries";
import type { NotePickerEntry } from "@/react/music/note-picker/NotePickerEntry.type";
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
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";
import { type SongKey } from "@/shared/song/songKeyOptions";
import { type ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import createNoteToggleHandler from "./createNoteToggleHandler";
import useSciInversions from "./useChordInversions";
import useEscapeToClose from "./useEscapeToClose";

/** The root note is always counted, adding one to the interval count for total note count. */
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
	chordInversions: readonly SciInversion[];
	inversionBaseShapeName: string;
	inversionPreviewTokens: ReadonlyMap<SongKey, string>;
	inversionSlashPreviewTokens: ReadonlyMap<SongKey, string>;
	slashPreviewToken: string;
	slashPreviewShapeName: string;
	previewShapeSpelling: string;
	absoluteRoot: SongKey | undefined;
	handleInsert: () => void;
	handleNoteToggle: (semitoneOffset: number) => void;
	handleSelectInversion: (inversion: SciInversion) => void;
	handleSelectShapeInversion: (sourceShapeCode: string, inversion: SciInversion) => void;
	inversionBaseShapeCode: string | undefined;
	selectedBassNote: SongKey | undefined;
	/** True when a shape card in search results should show as selected. */
	shapeHighlightActive: boolean;
	notePickerEntries: readonly NotePickerEntry[];
	previewToken: string;
	rootPickerDisplayMode: ChordDisplayModeType;
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	selectedShapeCode: string;
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
		inversionBaseShapeCode,
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

	// Resolve the selected shape directly from the catalog. Falls back to a synthetic shape
	// when the user has toggled an interval combination not found in the catalog (comma-code).
	const selectedShape: ChordShape | undefined =
		getChordShapeByCode(selectedShapeCode) ??
		(selectedShapeCode.includes(",")
			? {
					id: 0,
					name: selectedShapeCode,
					code: selectedShapeCode,
					prefer: false,
					noteCount: selectedShapeCode.split(",").length + ROOT_NOTE_COUNT,
					spelling: selectedShapeCode,
					ordering: 0,
					intervalForm: "",
					altNames: "",
					searchText: selectedShapeCode,
				}
			: undefined);

	// True when a shape result card should be highlighted: always at root position, and when
	// an inversion is active only if it resolved to a catalogued SCI shape.
	const shapeHighlightActive =
		selectedBassNote === undefined || activeInversion?.matchedShape !== undefined;

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

	return {
		alternatePreviewLabel,
		alternatePreviewToken,
		canonicalToken,
		chordDisplayCategory,
		chordInversions: displaySciInversions,
		inversionBaseShapeName,
		inversionPreviewTokens: displayInversionPreviewTokens,
		inversionSlashPreviewTokens: slashPreviewTokens,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
		absoluteRoot,
		handleInsert,
		handleNoteToggle,
		handleSelectInversion,
		handleSelectShapeInversion,
		inversionBaseShapeCode,
		selectedBassNote,
		shapeHighlightActive,
		notePickerEntries,
		previewToken,
		rootPickerDisplayMode,
		selectedRoot: effectiveDisplayRoot,
		selectedShape,
		selectedShapeCode,
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
