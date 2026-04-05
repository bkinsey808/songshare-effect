import { useRef, useState } from "react";

import findChordTokenAtSelection from "@/react/song/song-form/chord-picker/findChordTokenAtSelection";
import insertTextAtSelection from "@/react/song/song-form/chord-picker/insertTextAtSelection";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";

const DEFAULT_SELECTION_POSITION = 0;

type UseSortableGridCellsParams = Readonly<{
	slideId: string;
	fields: readonly string[];
	slides: Readonly<Record<string, Slide>>;
	safeGetField: (params: Readonly<{ slides: Readonly<Record<string, Slide>>; slideId: string; field: string }>) => string;
	editFieldValue: (params: Readonly<{ slideId: string; field: string; value: string }>) => void;
	openChordPicker: OpenChordPicker;
}>;

type UseSortableGridCellsReturn = Readonly<{
	lyricsTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
	isEditingChord: boolean;
	hasLyrics: boolean;
	onSyncLyricsSelection: () => void;
	onOpenChordPicker: () => void;
}>;

export default function useSortableGridCells({
	slideId,
	fields,
	slides,
	safeGetField,
	editFieldValue,
	openChordPicker,
}: UseSortableGridCellsParams): UseSortableGridCellsReturn {
	const lyricsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [lyricsSelection, setLyricsSelection] = useState({
		selectionStart: DEFAULT_SELECTION_POSITION,
		selectionEnd: DEFAULT_SELECTION_POSITION,
	});
	const lyricsValue = safeGetField({ slides, slideId, field: "lyrics" });
	const selectedChordToken = findChordTokenAtSelection({
		value: lyricsValue,
		selectionStart: lyricsSelection.selectionStart,
		selectionEnd: lyricsSelection.selectionEnd,
	});
	const isEditingChord = selectedChordToken !== undefined;
	const hasLyrics = fields.includes("lyrics");

	function onSyncLyricsSelection(): void {
		setLyricsSelection({
			selectionStart: lyricsTextareaRef.current?.selectionStart ?? DEFAULT_SELECTION_POSITION,
			selectionEnd: lyricsTextareaRef.current?.selectionEnd ?? DEFAULT_SELECTION_POSITION,
		});
	}

	function onOpenChordPicker(): void {
		const selectionStart = lyricsTextareaRef.current?.selectionStart;
		const selectionEnd = lyricsTextareaRef.current?.selectionEnd;
		const chordTokenAtSelection = findChordTokenAtSelection({
			value: lyricsValue,
			selectionStart,
			selectionEnd,
		});

		openChordPicker({
			submitChord: (token) => {
				const currentLyrics = safeGetField({ slides, slideId, field: "lyrics" });
				const insertionResult = insertTextAtSelection({
					value: currentLyrics,
					insertion: token,
					...(chordTokenAtSelection === undefined
						? {
								...(selectionStart === undefined ? {} : { selectionStart }),
								...(selectionEnd === undefined ? {} : { selectionEnd }),
							}
						: {
								selectionStart: chordTokenAtSelection.tokenStart,
								selectionEnd: chordTokenAtSelection.tokenEnd,
							}),
				});
				editFieldValue({ slideId, field: "lyrics", value: insertionResult.nextValue });
				setLyricsSelection({
					selectionStart: insertionResult.nextSelectionStart,
					selectionEnd: insertionResult.nextSelectionStart,
				});
				requestAnimationFrame(() => {
					lyricsTextareaRef.current?.focus();
					lyricsTextareaRef.current?.setSelectionRange(
						insertionResult.nextSelectionStart,
						insertionResult.nextSelectionStart,
					);
				});
			},
			...(chordTokenAtSelection === undefined
				? {}
				: {
						initialChordToken: chordTokenAtSelection.token,
						isEditingChord: true,
					}),
		});
	}

	return {
		lyricsTextareaRef,
		isEditingChord,
		hasLyrics,
		onSyncLyricsSelection,
		onOpenChordPicker,
	};
}
