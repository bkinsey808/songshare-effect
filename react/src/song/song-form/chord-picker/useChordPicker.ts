import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import formatChordRootForDisplay from "@/shared/music/chord-display/formatChordRootForDisplay";
import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import {
	getChordShapeByCode,
	searchChordShapes,
	type ChordShape,
} from "@/shared/music/chord-shapes";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import {
	ChordDisplayCategory,
	type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";
import { getChordDisplayModeFromPreferences } from "@/shared/user/chord-display/chordDisplayPreferences";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import getCanonicalToken from "./getCanonicalToken";
import getInitialMaxNotes from "./getInitialMaxNotes";
import getInitialShapeCode from "./getInitialShapeCode";
import type { SelectedRoot } from "./root-picker/chordPickerRootOptionTypes";
import getInitialSelectedRoot from "./root-picker/getInitialSelectedRoot";

const FIRST_SHAPE_INDEX = 0;
const OCTAVE_SEMITONE_COUNT = 12;
const ROOT_INTERVAL = "1";
const INTERVAL_SEMITONE_OFFSET: Readonly<Record<string, number>> = {
	"1": 0,
	"2": 2,
	"3": 4,
	"4": 5,
	"5": 7,
	"6": 9,
	"7": 11,
	b2: 1,
	b3: 3,
	b5: 6,
	b6: 8,
	b7: 10,
} as const;

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
	chordDisplayMode: ReturnType<typeof useChordDisplayModePreference>["chordDisplayMode"];
	displayedShapes: readonly ChordShape[];
	handleInsert: () => void;
	maxNotes: number;
	maxNotesInputId: string;
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

function getAbsoluteSelectedRoot(
	selectedRoot: SelectedRoot,
	songKey: SongKey | "",
): SongKey | undefined {
	if (selectedRoot.rootType === "absolute") {
		return selectedRoot.root;
	}

	return getAbsoluteRootFromRomanDegree(selectedRoot.root, songKey);
}

function formatLetterFormPreview({
	selectedRoot,
	selectedShape,
	chordDisplayMode,
	songKey,
}: Readonly<{
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): string {
	const absoluteRoot = getAbsoluteSelectedRoot(selectedRoot, songKey);
	if (absoluteRoot === undefined) {
		return "";
	}

	const rootSemitone = rootSemitoneMap[absoluteRoot];
	const intervals =
		selectedShape?.spelling === "" ? [] : (selectedShape?.spelling.split(",") ?? []);
	const noteSequence = [ROOT_INTERVAL, ...intervals]
		.map((interval) => interval.trim())
		.map((interval) => INTERVAL_SEMITONE_OFFSET[interval])
		.filter((offset): offset is number => offset !== undefined)
		.map((offset) => songKeysBySemitone[(rootSemitone + offset) % OCTAVE_SEMITONE_COUNT])
		.filter((root): root is SongKey => root !== undefined)
		.map((root) =>
			formatChordRootForDisplay({
				root,
				chordDisplayMode,
				songKey,
			}),
		);

	return noteSequence.join(" ");
}

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
	const rootPickerDisplayMode =
		chordDisplayCategory === ChordDisplayCategory.scaleDegree && !isSongKey(songKey)
			? getChordDisplayModeFromPreferences({
					chordDisplayCategory: ChordDisplayCategory.letters,
					chordLetterDisplay,
					chordScaleDegreeDisplay,
				})
			: chordDisplayMode;
	const [selectedRoot, setSelectedRoot] = useState<SelectedRoot>(() =>
		getInitialSelectedRoot({
			chordDisplayMode: rootPickerDisplayMode,
			initialChordToken,
			songKey,
		}),
	);
	const previousSongKeyRef = useRef<SongKey | "">(songKey);
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
	const searchInputId = useId();
	const maxNotesInputId = useId();
	const availableShapes = searchChordShapes({ query, maxNotes });
	const selectedShapeInResults = availableShapes.find((shape) => shape.code === selectedShapeCode);
	const displayedShapes =
		selectedShapeInResults === undefined
			? availableShapes
			: [
					selectedShapeInResults,
					...availableShapes.filter((shape) => shape.code !== selectedShapeInResults.code),
				];
	const selectedShape =
		getChordShapeByCode(selectedShapeCode) ?? displayedShapes[FIRST_SHAPE_INDEX];
	const canonicalToken = getCanonicalToken({
		selectedRoot,
		selectedShapeCode: selectedShape?.code,
		songKey,
	});
	const previewToken =
		canonicalToken === undefined
			? ""
			: transformChordTextForDisplay(canonicalToken, {
					chordDisplayMode,
					songKey,
				});
	const alternatePreviewCategory: ChordDisplayCategoryType =
		chordDisplayCategory === ChordDisplayCategory.letters
			? ChordDisplayCategory.scaleDegree
			: ChordDisplayCategory.letters;
	const alternatePreviewMode = getChordDisplayModeFromPreferences({
		chordDisplayCategory: alternatePreviewCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
	});
	const hasScaleDegreeAlternatePreview =
		alternatePreviewCategory !== ChordDisplayCategory.scaleDegree || isSongKey(songKey);
	let alternatePreviewLabel = "—";
	if (hasScaleDegreeAlternatePreview) {
		alternatePreviewLabel =
			alternatePreviewCategory === ChordDisplayCategory.letters
				? t("song.chordLetterForm", "Letter Form")
				: t("song.chordScaleDegreeForm", "Scale Degree Form");
	}
	const alternatePreviewCompactToken =
		!hasScaleDegreeAlternatePreview || canonicalToken === undefined
			? ""
			: transformChordTextForDisplay(canonicalToken, {
					chordDisplayMode: alternatePreviewMode,
					songKey,
				});
	let alternatePreviewToken = "";
	if (!hasScaleDegreeAlternatePreview) {
		alternatePreviewToken = "";
	} else if (alternatePreviewCategory === ChordDisplayCategory.letters) {
		alternatePreviewToken = [
			alternatePreviewCompactToken,
			formatLetterFormPreview({
				selectedRoot,
				selectedShape,
				chordDisplayMode: alternatePreviewMode,
				songKey,
			}),
		]
			.filter((part) => part !== "")
			.join(" ");
	} else if (canonicalToken !== undefined) {
		alternatePreviewToken = transformChordTextForDisplay(canonicalToken, {
			chordDisplayMode: alternatePreviewMode,
			songKey,
		});
	}

	// Close the routed picker when Escape is pressed so keyboard users can cancel quickly.
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== "Escape") {
				return;
			}

			closeChordPicker();
		}

		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeChordPicker]);

	// When the song key is cleared, convert any selected roman root back to an absolute note.
	useEffect(() => {
		const previousSongKey = previousSongKeyRef.current;
		previousSongKeyRef.current = songKey;

		if (isSongKey(previousSongKey) && !isSongKey(songKey) && selectedRoot.rootType === "roman") {
			const absoluteRoot = getAbsoluteRootFromRomanDegree(selectedRoot.root, previousSongKey);
			if (absoluteRoot !== undefined) {
				setSelectedRoot({
					root: absoluteRoot,
					rootType: "absolute",
					label: absoluteRoot,
				});
			}
		}
	}, [selectedRoot, songKey]);

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

	return {
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
	};
}
