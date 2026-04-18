import { useRef, useState } from "react";

import findChordTokenAtSelection from "@/react/song/song-form/chord-picker/findChordTokenAtSelection";
import findCurrentChordTokenAtSelection from "@/react/song/song-form/chord-picker/findCurrentChordTokenAtSelection";
import insertTextAtSelection from "@/react/song/song-form/chord-picker/insertTextAtSelection";
import findLanguageTokenAtSelection from "@/react/song/song-form/language-picker/findLanguageTokenAtSelection";
import { type Slide } from "@/react/song/song-form/song-form-types";
import formatStoredChordBodyAsToken from "@/shared/music/chord-display/formatStoredChordBodyAsToken";

type UseSlideFieldEditorParams = Readonly<{
	field: string;
	slide: Slide | undefined;
	songChords: readonly string[];
	onEditFieldValue: (
		params: Readonly<{
			field: string;
			value: string;
		}>,
	) => void;
}>;

type UseSlideFieldEditorReturn = Readonly<{
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	selectedChordToken: ReturnType<typeof findChordTokenAtSelection>;
	currentChordToken: ReturnType<typeof findCurrentChordTokenAtSelection>;
	existingChordTokens: readonly string[];
	selectedLanguageToken: ReturnType<typeof findLanguageTokenAtSelection>;
	handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSelectChord: (token: string) => void;
	handleSelectLanguage: (code: string) => void;
	handleSyncSelection: () => void;
}>;

type TextSelectionSnapshot = Readonly<{
	selectionStart: number | undefined;
	selectionEnd: number | undefined;
}>;

type OverlappingLanguageToken = Readonly<{
	tokenStart: number;
	tokenEnd: number;
}>;

/**
 * Hook that manages text selection state and token insertion (chords/languages) for one slide field.
 *
 * @param field - The field name (e.g. "lyrics" or "script")
 * @param slide - Current slide being edited
 * @param songChords - Stored chord bodies defined on the song; used to populate the chord pulldown
 * @param onEditFieldValue - Slide-aware field update callback from the parent card hook
 * @returns Textarea refs, derived selection state, and editor handlers
 */
export default function useSlideFieldEditor({
	field,
	slide,
	songChords,
	onEditFieldValue,
}: UseSlideFieldEditorParams): UseSlideFieldEditorReturn {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [selection, setSelection] = useState({
		selectionStart: undefined as number | undefined,
		selectionEnd: undefined as number | undefined,
	});
	const fieldValue = slide?.field_data[field] ?? "";

	const selectedChordToken =
		field === "lyrics"
			? findChordTokenAtSelection({
					value: fieldValue,
					selectionStart: selection.selectionStart,
					selectionEnd: selection.selectionEnd,
				})
			: undefined;
	const currentChordToken =
		field === "lyrics"
			? findCurrentChordTokenAtSelection({
					value: fieldValue,
					selectionStart: selection.selectionStart,
					selectionEnd: selection.selectionEnd,
				})
			: undefined;
	const existingChordTokens = field === "lyrics" ? songChords : [];

	const selectedLanguageToken = findLanguageTokenAtSelection({
		value: fieldValue,
		selectionStart: selection.selectionStart,
		selectionEnd: selection.selectionEnd,
	});

	/**
	 * Reads the current selection from the live textarea when available, falling back to cached state.
	 *
	 * @returns Current selection start/end offsets for this field editor
	 */
	function getCurrentSelection(): TextSelectionSnapshot {
		const liveSelectionStart = textareaRef.current?.selectionStart;
		const liveSelectionEnd = textareaRef.current?.selectionEnd;
		if (liveSelectionStart === undefined || liveSelectionEnd === undefined) {
			return selection;
		}

		return {
			selectionStart: liveSelectionStart ?? selection.selectionStart,
			selectionEnd: liveSelectionEnd ?? selection.selectionEnd,
		};
	}

	/**
	 * Finds a language token only when the current selection overlaps that token.
	 *
	 * Unlike the display lookup, this does not fall back to earlier tokens because
	 * selecting a language should insert at the caret unless the user is editing an
	 * existing token directly.
	 *
	 * @param currentSelection - Selection snapshot used to detect overlap
	 * @returns Overlapping token boundaries, or undefined when no token is under selection
	 */
	function findOverlappingLanguageToken(
		currentSelection: TextSelectionSnapshot,
	): OverlappingLanguageToken | undefined {
		if (
			currentSelection.selectionStart === undefined ||
			currentSelection.selectionEnd === undefined
		) {
			return undefined;
		}

		for (const match of fieldValue.matchAll(/\{([a-zA-Z0-9-]+?)\}/g)) {
			const [token] = match;
			const tokenStart = match.index;
			if (tokenStart !== undefined) {
				const tokenEnd = tokenStart + token.length;
				const isCollapsedSelection =
					currentSelection.selectionStart === currentSelection.selectionEnd;
				const overlapsToken = isCollapsedSelection
					? currentSelection.selectionStart >= tokenStart &&
						currentSelection.selectionStart < tokenEnd
					: currentSelection.selectionStart < tokenEnd &&
						currentSelection.selectionEnd > tokenStart;

				if (overlapsToken) {
					return { tokenStart, tokenEnd };
				}
			}
		}

		return undefined;
	}

	/**
	 * Updates the field and keeps the local selection snapshot in sync.
	 *
	 * @param event - Textarea change event from the editor
	 * @returns Nothing
	 */
	function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		onEditFieldValue({
			field,
			value: event.target.value,
		});
		setSelection({
			selectionStart: event.target.selectionStart,
			selectionEnd: event.target.selectionEnd,
		});
	}

	/**
	 * Inserts or replaces the selected token and restores the caret after the edit.
	 *
	 * @param token - Token to insert
	 * @param selectionStart - Optional insertion or replacement start offset
	 * @param selectionEnd - Optional insertion or replacement end offset
	 * @returns Nothing
	 */
	function handleInsert(token: string, selectionStart?: number, selectionEnd?: number): void {
		const currentSlide = slide;
		if (currentSlide === undefined) {
			return;
		}

		const currentValue = currentSlide.field_data[field] ?? "";
		const insertionResult = insertTextAtSelection({
			value: currentValue,
			insertion: token,
			...(selectionStart === undefined ? {} : { selectionStart }),
			...(selectionEnd === undefined ? {} : { selectionEnd }),
		});

		onEditFieldValue({
			field,
			value: insertionResult.nextValue,
		});
		setSelection({
			selectionStart: insertionResult.nextSelectionStart,
			selectionEnd: insertionResult.nextSelectionStart,
		});

		requestAnimationFrame(() => {
			textareaRef.current?.focus();
			textareaRef.current?.setSelectionRange(
				insertionResult.nextSelectionStart,
				insertionResult.nextSelectionStart,
			);
		});
	}

	/**
	 * Inserts or replaces a bracketed chord token at the current selection.
	 *
	 * @param token - Stored chord body to insert or use as a replacement
	 * @returns Nothing
	 */
	function handleSelectChord(token: string): void {
		const currentSelection = getCurrentSelection();
		const chordTokenAtSelection = findChordTokenAtSelection({
			value: fieldValue,
			selectionStart: currentSelection.selectionStart,
			selectionEnd: currentSelection.selectionEnd,
		});

		handleInsert(
			formatStoredChordBodyAsToken(token),
			chordTokenAtSelection?.tokenStart ?? currentSelection.selectionStart,
			chordTokenAtSelection?.tokenEnd ?? currentSelection.selectionEnd,
		);
	}

	/**
	 * Inserts or replaces a language token at the last known cursor position.
	 *
	 * @param code - BCP 47 language code to wrap in a `{code}` token
	 * @returns Nothing
	 */
	function handleSelectLanguage(code: string): void {
		const currentSelection = getCurrentSelection();
		const languageTokenAtSelection = findOverlappingLanguageToken(currentSelection);

		handleInsert(
			`{${code}}`,
			languageTokenAtSelection?.tokenStart ?? currentSelection.selectionStart,
			languageTokenAtSelection?.tokenEnd ?? currentSelection.selectionEnd,
		);
	}

	/**
	 * Copies the live textarea selection into local state used by edit affordances.
	 *
	 * @returns Nothing
	 */
	function handleSyncSelection(): void {
		setSelection({
			selectionStart: textareaRef.current?.selectionStart,
			selectionEnd: textareaRef.current?.selectionEnd,
		});
	}

	return {
		textareaRef,
		selectedChordToken,
		currentChordToken,
		existingChordTokens,
		selectedLanguageToken,
		handleChange,
		handleSelectChord,
		handleSelectLanguage,
		handleSyncSelection,
	};
}
