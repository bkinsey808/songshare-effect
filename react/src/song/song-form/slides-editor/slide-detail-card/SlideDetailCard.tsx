import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import Button from "@/react/lib/design-system/Button";
import FormField from "@/react/lib/design-system/form/FormField";
import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import ChevronUpIcon from "@/react/lib/design-system/icons/ChevronUpIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import InsertChordButton from "@/react/song/song-form/chord-picker/InsertChordButton";
import findChordTokenAtSelection from "@/react/song/song-form/chord-picker/findChordTokenAtSelection";
import insertTextAtSelection from "@/react/song/song-form/chord-picker/insertTextAtSelection";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";
import { safeGet } from "@/shared/utils/safe";

import SlideBackgroundLibraryContent from "../SlideBackgroundLibraryContent";
import useSlideDetailCard from "./useSlideDetailCard";

const TEXTAREA_MIN_ROWS = 3;
const DEFAULT_SELECTION_POSITION = 0;

type SlideDetailCardProps = Readonly<{
	slideId: string;
	idx: number;
	fields: readonly string[];
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

export default function SlideDetailCard({
	slideId,
	idx,
	fields,
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
}: SlideDetailCardProps): ReactElement | undefined {
	const { t } = useTranslation();
	const lyricsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [lyricsSelection, setLyricsSelection] = useState({
		selectionStart: DEFAULT_SELECTION_POSITION,
		selectionEnd: DEFAULT_SELECTION_POSITION,
	});

	const {
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
		onEditSlideName,
		onEditFieldValue,
		onToggleBackgroundPicker,
		onSelectBackgroundImage,
		onClearSlideBackgroundImage,
		onMoveUp,
		onMoveDown,
		onCancelDelete,
		onConfirmDelete,
		onRemoveFromPresentation,
		onRequestDelete,
	} = useSlideDetailCard({
		slideId,
		idx,
		slideOrder,
		slides,
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
	});

	if (!slide) {
		return undefined;
	}

	const lyricsValue = safeGet(slide.field_data, "lyrics") ?? "";
	const selectedChordToken = findChordTokenAtSelection({
		value: lyricsValue,
		selectionStart: lyricsSelection.selectionStart,
		selectionEnd: lyricsSelection.selectionEnd,
	});

	function handleInsertChord(token: string, selectionStart?: number, selectionEnd?: number): void {
		const currentSlide = slide;
		if (currentSlide === undefined) {
			return;
		}

		const currentLyrics = safeGet(currentSlide.field_data, "lyrics") ?? "";
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

		requestAnimationFrame(() => {
			lyricsTextareaRef.current?.focus();
			lyricsTextareaRef.current?.setSelectionRange(
				insertionResult.nextSelectionStart,
				insertionResult.nextSelectionStart,
			);
		});
	}

	function handleOpenChordPicker(): void {
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

	function syncLyricsSelection(): void {
		setLyricsSelection({
			selectionStart: lyricsTextareaRef.current?.selectionStart ?? DEFAULT_SELECTION_POSITION,
			selectionEnd: lyricsTextareaRef.current?.selectionEnd ?? DEFAULT_SELECTION_POSITION,
		});
	}

	return (
		<div className="mb-6 rounded-lg border border-gray-600 p-4" {...duplicateTintProps}>
			<div className="mb-6">
				<FormField label={t("song.slideName", "Slide Name")}>
					<input
						type="text"
						value={slide.slide_name}
						onChange={(event) => {
							onEditSlideName(event.target.value);
						}}
						className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-4 py-1 text-white"
						placeholder="Slide name"
					/>
				</FormField>
			</div>

			{fields.map((field) => (
				<div key={field} className="mb-6">
					{field === "lyrics" ? (
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="text-sm font-bold text-gray-300">{t("song.lyrics", "Lyrics")}</span>
								<InsertChordButton
									isEditingChord={selectedChordToken !== undefined}
									onOpenChordPicker={handleOpenChordPicker}
								/>
							</div>
							<AutoExpandingTextarea
								textareaRef={lyricsTextareaRef}
								value={lyricsValue}
								onChange={(event) => {
									onEditFieldValue({
										field,
										value: event.target.value,
									});
									setLyricsSelection({
										selectionStart: event.target.selectionStart,
										selectionEnd: event.target.selectionEnd,
									});
								}}
								onClick={syncLyricsSelection}
								onFocus={syncLyricsSelection}
								onKeyUp={syncLyricsSelection}
								onSelect={syncLyricsSelection}
								className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
								minRows={TEXTAREA_MIN_ROWS}
								growWithContent
								resizeOnExternalValueChange={false}
							/>
						</div>
					) : (
						<FormField label={t(`song.${field}`, field)}>
							<AutoExpandingTextarea
								value={safeGet(slide.field_data, field) ?? ""}
								onChange={(event) => {
									onEditFieldValue({
										field,
										value: event.target.value,
									});
								}}
								className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
								minRows={TEXTAREA_MIN_ROWS}
								growWithContent
								resizeOnExternalValueChange={false}
							/>
						</FormField>
					)}
				</div>
			))}
			<div className="mb-6">
				<FormField label={t("song.slideBackgroundImage", "Slide Background Image")}>
					<div className="mt-2 space-y-3">
						{slide.background_image_url === undefined ? (
							<div className="rounded border border-dashed border-gray-600 px-3 py-2 text-sm text-gray-400">
								{t("song.slideBackgroundImage.none", "No background image selected")}
							</div>
						) : (
							<div className="overflow-hidden rounded border border-gray-600 bg-gray-900">
								<img
									src={slide.background_image_url}
									alt={t("song.slideBackgroundImage.previewAlt", "Slide background preview")}
									className="h-32 w-full object-cover"
								/>
							</div>
						)}
						<div className="flex flex-wrap items-center gap-2">
							<Button size="compact" variant="outlineSecondary" onClick={onToggleBackgroundPicker}>
								{isBackgroundPickerOpen
									? t("song.slideBackgroundImage.hideLibrary", "Hide Library")
									: t("song.slideBackgroundImage.chooseFromLibrary", "Choose from Library")}
							</Button>
							<Button
								size="compact"
								variant="outlineDanger"
								disabled={slide.background_image_url === undefined}
								onClick={onClearSlideBackgroundImage}
							>
								{t("song.slideBackgroundImage.clear", "Clear Background")}
							</Button>
						</div>
						{isBackgroundPickerOpen && (
							<div className="rounded border border-gray-600 bg-gray-900/40 p-3">
								<SlideBackgroundLibraryContent
									isImageLibraryLoading={isImageLibraryLoading}
									imageLibraryEntryList={imageLibraryEntryList}
									selectedBackgroundImageId={slide.background_image_id}
									onSelectBackgroundImage={({ backgroundImageId, backgroundImageUrl }) => {
										onSelectBackgroundImage({
											backgroundImageId,
											backgroundImageUrl,
										});
									}}
								/>
							</div>
						)}
					</div>
				</FormField>
			</div>
			{hasMultipleSlides && (
				<div className="mt-4 flex flex-wrap items-center justify-start gap-2">
					<Button
						size="compact"
						variant="outlineSecondary"
						icon={<ChevronUpIcon className="size-4" />}
						onClick={onMoveUp}
						disabled={!canMoveUp}
						aria-label={t("song.moveSlideUpAria", "Move slide up in presentation")}
					>
						{t("song.moveSlideUp", "Up")}
					</Button>
					<Button
						size="compact"
						variant="outlineSecondary"
						icon={<ChevronDownIcon className="size-4" />}
						onClick={onMoveDown}
						disabled={!canMoveDown}
						aria-label={t("song.moveSlideDownAria", "Move slide down in presentation")}
					>
						{t("song.moveSlideDown", "Down")}
					</Button>
					{(() => {
						if (isConfirmingDelete) {
							return (
								<>
									<span className="flex items-center text-sm text-gray-300">
										{t("song.deleteSlide.confirmPrompt", "Delete this slide permanently?")}
									</span>
									<Button size="compact" variant="outlineSecondary" onClick={onCancelDelete}>
										{t("song.deleteSlide.cancel", "Cancel")}
									</Button>
									<Button
										size="compact"
										variant="danger"
										icon={<TrashIcon className="size-4" />}
										onClick={onConfirmDelete}
									>
										{t("song.deleteSlide.confirm", "Delete slide")}
									</Button>
								</>
							);
						}
						if (isDuplicate) {
							return (
								<Button
									size="compact"
									variant="outlineDanger"
									icon={<TrashIcon className="size-4" />}
									onClick={onRemoveFromPresentation}
									aria-label={t("song.removeFromPresentation", "Remove from presentation")}
									data-testid="remove-from-presentation"
								>
									{t("song.removeFromPresentation", "Remove Slide")}
								</Button>
							);
						}
						return (
							<Button
								size="compact"
								variant="outlineDanger"
								icon={<TrashIcon className="size-4" />}
								onClick={onRequestDelete}
								aria-label={t("song.deleteSlide.button", "Delete slide")}
								data-testid="delete-slide-button"
							>
								{t("song.deleteSlide.button", "Delete Slide")}
							</Button>
						);
					})()}
				</div>
			)}
		</div>
	);
}
