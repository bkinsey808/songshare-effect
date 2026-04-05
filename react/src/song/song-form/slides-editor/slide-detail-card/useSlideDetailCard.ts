import { useRef, useState } from "react";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import findChordTokenAtSelection from "@/react/song/song-form/chord-picker/findChordTokenAtSelection";
import insertTextAtSelection from "@/react/song/song-form/chord-picker/insertTextAtSelection";
import hashToHue from "@/react/song/song-form/grid-editor/duplicateTint";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";
import { ONE, ZERO } from "@/shared/constants/shared-constants";
import { safeGet } from "@/shared/utils/safe";

const DEFAULT_SELECTION_POSITION = 0;

type UseSlideDetailCardParams = Readonly<{
	slideId: string;
	idx: number;
	slideOrder: readonly string[];
	slides: Readonly<Record<string, Slide>>;
	openChordPicker: OpenChordPicker;
	confirmingDeleteSlideId: string | undefined;
	setConfirmingDeleteSlideId: (slideId: string | undefined) => void;
	backgroundPickerSlideId: string | undefined;
	editSlideName: (params: Readonly<{ slideId: string; newName: string }>) => void;
	editFieldValue: (
		params: Readonly<{
			slideId: string;
			field: string;
			value: string;
		}>,
	) => void;
	toggleBackgroundPicker: (slideId: string) => void;
	selectSlideBackgroundImage: (
		params: Readonly<{
			slideId: string;
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	clearSlideBackgroundImage: (slideId: string) => void;
	moveSlideUp: (index: number) => void;
	moveSlideDown: (index: number) => void;
	deleteSlide: (slideId: string) => void;
	removeSlideOrder: (params: Readonly<{ slideId: string; index?: number }>) => void;
}>;

type UseSlideDetailCardReturn = Readonly<{
	slide: Slide | undefined;
	isDuplicate: boolean;
	isConfirmingDelete: boolean;
	isBackgroundPickerOpen: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	hasMultipleSlides: boolean;
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	duplicateTintProps:
		| Readonly<{
				"data-duplicate-tint": "";
				style: React.CSSProperties & Record<"--duplicate-row-hue", string>;
		  }>
		| undefined;
	lyricsTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
	selectedChordToken: ReturnType<typeof findChordTokenAtSelection>;
	onEditSlideName: (newName: string) => void;
	onEditFieldValue: (
		params: Readonly<{
			field: string;
			value: string;
		}>,
	) => void;
	onLyricsChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onToggleBackgroundPicker: () => void;
	onSelectBackgroundImage: (
		params: Readonly<{
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	onOpenChordPicker: () => void;
	onClearSlideBackgroundImage: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onCancelDelete: () => void;
	onConfirmDelete: () => void;
	onRemoveFromPresentation: () => void;
	onRequestDelete: () => void;
	onSyncLyricsSelection: () => void;
}>;

/**
 * Computes card-level derived view data used by `SlideDetailCard`.
 *
 * @param slideId - Current slide id rendered by the card
 * @param slideOrder - Ordered list of slide ids used to detect duplicate placement
 * @param slides - Slide map used to resolve the current slide
 * @returns Card view-model state and conditional duplicate tint props
 */
export default function useSlideDetailCard({
	slideId,
	idx,
	slideOrder,
	slides,
	openChordPicker,
	confirmingDeleteSlideId,
	setConfirmingDeleteSlideId,
	backgroundPickerSlideId,
	editSlideName,
	editFieldValue,
	toggleBackgroundPicker,
	selectSlideBackgroundImage,
	clearSlideBackgroundImage,
	moveSlideUp,
	moveSlideDown,
	deleteSlide,
	removeSlideOrder,
}: UseSlideDetailCardParams): UseSlideDetailCardReturn {
	const imageLibraryEntries = useAppStore((state: AppSlice) => state.imageLibraryEntries);
	const isImageLibraryLoading = useAppStore((state: AppSlice) => state.isImageLibraryLoading);
	const imageLibraryEntryList = Object.values(imageLibraryEntries);
	const isDuplicate = slideOrder.filter((id) => id === slideId).length > ONE;
	const isConfirmingDelete = confirmingDeleteSlideId === slideId;
	const isBackgroundPickerOpen = backgroundPickerSlideId === slideId;
	const canMoveUp = idx !== ZERO;
	const canMoveDown = idx !== slideOrder.length - ONE;
	const hasMultipleSlides = slideOrder.length > ONE;
	const slide = safeGet(slides, slideId);
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
	const duplicateTintProps = isDuplicate
		? {
				"data-duplicate-tint": "" as const,
				style: {
					"--duplicate-row-hue": `${hashToHue(slideId)}`,
				} as React.CSSProperties & Record<"--duplicate-row-hue", string>,
			}
		: undefined;

	/**
	 * Updates the current slide name.
	 *
	 * @param newName - New slide name entered by the user
	 * @returns Nothing
	 */
	function onEditSlideName(newName: string): void {
		editSlideName({ slideId, newName });
	}

	/**
	 * Updates one editable field value on the current slide.
	 *
	 * @param params - Field key and value payload from textarea change
	 * @returns Nothing
	 */
	function onEditFieldValue({
		field,
		value,
	}: Readonly<{
		field: string;
		value: string;
	}>): void {
		editFieldValue({ slideId, field, value });
	}

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

	/**
	 * Toggles the background-image picker panel for this slide.
	 *
	 * @returns Nothing
	 */
	function onToggleBackgroundPicker(): void {
		toggleBackgroundPicker(slideId);
	}

	/**
	 * Selects a background image for this slide.
	 *
	 * @param params - Selected library image id and URL
	 * @returns Nothing
	 */
	function onSelectBackgroundImage({
		backgroundImageId,
		backgroundImageUrl,
	}: Readonly<{
		backgroundImageId: string;
		backgroundImageUrl: string;
	}>): void {
		selectSlideBackgroundImage({ slideId, backgroundImageId, backgroundImageUrl });
	}

	/**
	 * Clears the current slide background image.
	 *
	 * @returns Nothing
	 */
	function onClearSlideBackgroundImage(): void {
		clearSlideBackgroundImage(slideId);
	}

	/**
	 * Moves this slide up by one position in the presentation order.
	 *
	 * @returns Nothing
	 */
	function onMoveUp(): void {
		moveSlideUp(idx);
	}

	/**
	 * Moves this slide down by one position in the presentation order.
	 *
	 * @returns Nothing
	 */
	function onMoveDown(): void {
		moveSlideDown(idx);
	}

	/**
	 * Cancels delete confirmation for all slide cards.
	 *
	 * @returns Nothing
	 */
	function onCancelDelete(): void {
		setConfirmingDeleteSlideId(undefined);
	}

	/**
	 * Confirms deletion of this slide and closes confirmation state.
	 *
	 * @returns Nothing
	 */
	function onConfirmDelete(): void {
		deleteSlide(slideId);
		setConfirmingDeleteSlideId(undefined);
	}

	/**
	 * Removes only this occurrence from presentation order.
	 *
	 * @returns Nothing
	 */
	function onRemoveFromPresentation(): void {
		removeSlideOrder({ slideId, index: idx });
	}

	/**
	 * Starts delete confirmation mode for this slide.
	 *
	 * @returns Nothing
	 */
	function onRequestDelete(): void {
		setConfirmingDeleteSlideId(slideId);
	}

	return {
		slide,
		isDuplicate,
		isConfirmingDelete,
		isBackgroundPickerOpen,
		canMoveUp,
		canMoveDown,
		hasMultipleSlides,
		isImageLibraryLoading,
		imageLibraryEntryList,
		duplicateTintProps,
		lyricsTextareaRef,
		selectedChordToken,
		onEditSlideName,
		onEditFieldValue,
		onLyricsChange,
		onToggleBackgroundPicker,
		onSelectBackgroundImage,
		onOpenChordPicker,
		onClearSlideBackgroundImage,
		onMoveUp,
		onMoveDown,
		onCancelDelete,
		onConfirmDelete,
		onRemoveFromPresentation,
		onRequestDelete,
		onSyncLyricsSelection,
	};
}
