import { useRef, useState } from "react";

import findChordTokenAtSelection from "@/react/song/song-form/chord-picker/findChordTokenAtSelection";
import insertTextAtSelection from "@/react/song/song-form/chord-picker/insertTextAtSelection";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";

const DEFAULT_SELECTION_POSITION = 0;

type UseSlideLyricsEditorParams = Readonly<{
	slide: Slide | undefined;
	openChordPicker: OpenChordPicker;
	onEditFieldValue: (
		params: Readonly<{
			field: string;
			value: string;
		}>,
	) => void;
}>;

type UseSlideLyricsEditorReturn = Readonly<{
	lyricsTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
	selectedChordToken: ReturnType<typeof findChordTokenAtSelection>;
	onLyricsChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onOpenChordPicker: () => void;
	onSyncLyricsSelection: () => void;
}>;

/**
 * Hook that manages lyrics selection state and chord insertion for one slide card.
 *
 * @param slide - Current slide being edited
 * @param openChordPicker - Callback to open the chord picker
 * @param onEditFieldValue - Slide-aware field update callback from the parent card hook
 * @returns Textarea refs, derived chord-selection state, and lyrics editor handlers
 */
export default function useSlideLyricsEditor({
	slide,
	openChordPicker,
	onEditFieldValue,
}: UseSlideLyricsEditorParams): UseSlideLyricsEditorReturn {
	const lyricsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [lyricsSelection, setLyricsSelection] = useState({
		selectionStart: DEFAULT_SELECTION_POSITION,
		selectionEnd: DEFAULT_SELECTION_POSITION,
	});
	const lyricsValue = slide?.field_data["lyrics"] ?? "";
	const selectedChordToken = findChordTokenAtSelection({
		value: lyricsValue,
		selectionStart: lyricsSelection.selectionStart,
		selectionEnd: lyricsSelection.selectionEnd,
	});

	/**
	 * Updates the lyrics field and keeps the local selection snapshot in sync.
	 *
	 * @param event - Textarea change event from the lyrics editor
	 * @returns Nothing
	 */
	function onLyricsChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		onEditFieldValue({
			field: "lyrics",
			value: event.target.value,
		});
		setLyricsSelection({
			selectionStart: event.target.selectionStart,
			selectionEnd: event.target.selectionEnd,
		});
	}

	/**
	 * Inserts or replaces the selected chord token and restores the caret after the edit.
	 *
	 * @param token - Chord token to insert into the lyrics
	 * @param selectionStart - Optional insertion or replacement start offset
	 * @param selectionEnd - Optional insertion or replacement end offset
	 * @returns Nothing
	 */
	function handleInsertChord(token: string, selectionStart?: number, selectionEnd?: number): void {
		const currentSlide = slide;
		if (currentSlide === undefined) {
			return;
		}

		const currentLyrics = currentSlide.field_data["lyrics"] ?? "";
		const insertionResult = insertTextAtSelection({
			value: currentLyrics,
			insertion: token,
			...(selectionStart === undefined ? {} : { selectionStart }),
			...(selectionEnd === undefined ? {} : { selectionEnd }),
		});

		onEditFieldValue({
			field: "lyrics",
			value: insertionResult.nextValue,
		});
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
	}

	/**
	 * Opens the chord picker with either insert or replace behavior based on the current selection.
	 *
	 * @returns Nothing
	 */
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
				handleInsertChord(
					token,
					chordTokenAtSelection?.tokenStart ?? selectionStart,
					chordTokenAtSelection?.tokenEnd ?? selectionEnd,
				);
			},
			...(chordTokenAtSelection === undefined
				? {}
				: {
						initialChordToken: chordTokenAtSelection.token,
						isEditingChord: true,
					}),
		});
	}

	/**
	 * Copies the live textarea selection into local state used by chord-edit affordances.
	 *
	 * @returns Nothing
	 */
	function onSyncLyricsSelection(): void {
		setLyricsSelection({
			selectionStart: lyricsTextareaRef.current?.selectionStart ?? DEFAULT_SELECTION_POSITION,
			selectionEnd: lyricsTextareaRef.current?.selectionEnd ?? DEFAULT_SELECTION_POSITION,
		});
	}

	return {
		lyricsTextareaRef,
		selectedChordToken,
		onLyricsChange,
		onOpenChordPicker,
		onSyncLyricsSelection,
	};
}
