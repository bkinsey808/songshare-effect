import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import FormField from "@/react/lib/design-system/form/FormField";
import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import ChevronUpIcon from "@/react/lib/design-system/icons/ChevronUpIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";

import SlideBackgroundLibraryContent from "../SlideBackgroundLibraryContent";
import SlideDetailFields from "./SlideDetailFields";
import useSlideDetailCard from "./useSlideDetailCard";

type SlideDetailCardProps = Readonly<{
	slideId: string;
	idx: number;
	fields: readonly string[];
	slideOrder: readonly string[];
	slides: Readonly<Record<string, Slide>>;
	uiState: Readonly<{
		confirmingDeleteSlideId: string | undefined;
		setConfirmingDeleteSlideId: (slideId: string | undefined) => void;
		backgroundPickerSlideId: string | undefined;
	}>;
	actions: Readonly<{
		openChordPicker: OpenChordPicker;
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
}>;

/**
 * Slide detail card UI used inside the slides editor.
 *
 * @param slideId - Id of the slide to render
 * @param idx - Index of the slide in the presentation order
 * @param fields - Editable field keys shown in the card
 * @param slideOrder - Current slide order array
 * @param slides - Map of slide id to Slide objects
 * @param uiState - Local UI state (confirm/delete/background picker)
 * @param actions - Action handlers passed from the parent editor
 * @returns A ReactElement representing the detailed slide card or undefined when slide missing
 */
export default function SlideDetailCard({
	slideId,
	idx,
	fields,
	slideOrder,
	slides,
	uiState,
	actions,
}: SlideDetailCardProps): ReactElement | undefined {
	const { t } = useTranslation();
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
	} = useSlideDetailCard({
		slideId,
		idx,
		slideOrder,
		slides,
		openChordPicker: actions.openChordPicker,
		confirmingDeleteSlideId: uiState.confirmingDeleteSlideId,
		setConfirmingDeleteSlideId: uiState.setConfirmingDeleteSlideId,
		backgroundPickerSlideId: uiState.backgroundPickerSlideId,
		editSlideName: actions.editSlideName,
		editFieldValue: actions.editFieldValue,
		toggleBackgroundPicker: actions.toggleBackgroundPicker,
		selectSlideBackgroundImage: actions.selectSlideBackgroundImage,
		clearSlideBackgroundImage: actions.clearSlideBackgroundImage,
		moveSlideUp: actions.moveSlideUp,
		moveSlideDown: actions.moveSlideDown,
		deleteSlide: actions.deleteSlide,
		removeSlideOrder: actions.removeSlideOrder,
	});

	if (!slide) {
		return undefined;
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

			<SlideDetailFields
				fields={fields}
				slide={slide}
				lyricsTextareaRef={lyricsTextareaRef}
				isEditingChord={selectedChordToken !== undefined}
				onEditFieldValue={onEditFieldValue}
				onLyricsChange={onLyricsChange}
				onOpenChordPicker={onOpenChordPicker}
				onSyncLyricsSelection={onSyncLyricsSelection}
			/>
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
									onSelectBackgroundImage={onSelectBackgroundImage}
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
