import { useState } from "react";
import { useTranslation } from "react-i18next";

import CreateSongIcon from "@/react/lib/design-system/icons/CreateSongIcon";
import EditSongIcon from "@/react/lib/design-system/icons/EditSongIcon";

import ChordPicker from "./chord-picker/ChordPicker";
import CollapsibleSection from "./CollapsibleSection";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import type { SongFormChordPickerRequest } from "./song-form-types";
import SongFormFields from "./SongFormFields";
import SongFormFooter from "./SongFormFooter";
import useSongForm from "./use-song-form/useSongForm";

const NO_PENDING_CHORD_PICKER_REQUEST = undefined;

/**
 * Render the song creation and edit page.
 *
 * @returns React element containing the full song editor UI.
 */
export default function SongForm(): ReactElement {
	const { t } = useTranslation();
	const [pendingChordPickerRequest, setPendingChordPickerRequest] = useState<
		SongFormChordPickerRequest | undefined
	>(NO_PENDING_CHORD_PICKER_REQUEST);

	const {
		getFieldError,
		isSubmitting,
		isLoadingData,
		isEditing,
		slideOrder,
		slides,
		fields,
		setSlideOrder,
		setSlides,
		toggleField,
		handleFormSubmit,
		formRef,
		resetForm,

		// Form field refs
		songNameRef,
		songSlugRef,

		// Controlled form field values
		formValues,
		setFormValue,

		// Collapsible section state
		isFormFieldsExpanded,
		setIsFormFieldsExpanded,
		isSlidesExpanded,
		setIsSlidesExpanded,
		isGridExpanded,
		setIsGridExpanded,

		// Handlers
		handleSongNameBlur,
		handleSave,
		handleCancel,
		handleDelete,
		hasChanges,

		// Tag state
		tags,
		setTags,
	} = useSongForm();

	/**
	 * Opens the chord picker with the callback details needed for the active editor target.
	 *
	 * @param request - Pending picker request from a lyrics field
	 * @returns void
	 */
	function openChordPicker(request: SongFormChordPickerRequest): void {
		setPendingChordPickerRequest(request);
	}

	/**
	 * Closes the chord picker and clears any pending insertion target.
	 *
	 * @returns void
	 */
	function closeChordPicker(): void {
		setPendingChordPickerRequest(NO_PENDING_CHORD_PICKER_REQUEST);
	}

	/**
	 * Sends the selected chord token back to the requesting field and clears picker state.
	 *
	 * @param token - Canonical chord token chosen in the picker
	 * @returns void
	 */
	function insertChordFromPicker(token: string): void {
		pendingChordPickerRequest?.submitChord(token);
		setPendingChordPickerRequest(NO_PENDING_CHORD_PICKER_REQUEST);
	}

	return (
		<>
			<div className="w-full">
				<div className="mb-6">
					<h1 className="mb-2 text-3xl font-bold">
						{isEditing
							? t("pages.songEdit.editTitle", "Edit Song")
							: t("pages.songEdit.createTitle", "Create New Song")}
					</h1>
					<p className="text-gray-400">
						{isEditing
							? t(
									"pages.songEdit.editDescription",
									"Make changes to your song and save when ready.",
								)
							: t(
									"pages.songEdit.createDescription",
									"Create a new song with lyrics, slides, and metadata.",
								)}
					</p>
				</div>

				{isLoadingData ? (
					<div className="flex items-center justify-center rounded-lg border border-gray-600 bg-gray-800 p-12">
						<div className="flex flex-col items-center space-y-4">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
							<p className="text-gray-400">{t("song.loadingData", "Loading song data...")}</p>
						</div>
					</div>
				) : (
					<div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
						<form
							ref={formRef}
							className="flex w-full flex-col gap-4"
							onSubmit={(event) => {
								event.preventDefault();
								// Extract form element from event and pass it to handler
								const formElement = event.currentTarget;
								void handleFormSubmit(formElement);
							}}
						>
							{/* Row 1: Song Form Fields (left) + Slides Editor (right) on desktop, stacked on mobile */}
							<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
								{/* Left Column - Song Form Fields */}
								<div className="lg:flex-1">
									<CollapsibleSection
										title="Song Details"
										icon={
											isEditing ? (
												<EditSongIcon className="size-5" />
											) : (
												<CreateSongIcon className="size-5" />
											)
										}
										isExpanded={isFormFieldsExpanded}
										onToggle={() => {
											// avoid implicit void-return shorthand
											setIsFormFieldsExpanded(!isFormFieldsExpanded);
										}}
									>
										<SongFormFields
											getFieldError={getFieldError}
											onSongNameBlur={handleSongNameBlur}
											songNameRef={songNameRef}
											songSlugRef={songSlugRef}
											formValues={formValues}
											setFormValue={setFormValue}
											tags={tags}
											setTags={setTags}
										/>
									</CollapsibleSection>
								</div>

								{/* Right Column - Slides Editor */}
								<div className="lg:flex-1">
									<CollapsibleSection
										title="Slides Editor"
										icon="📄"
										isExpanded={isSlidesExpanded}
										onToggle={() => {
											setIsSlidesExpanded(!isSlidesExpanded);
										}}
									>
										<SlidesEditor
											fields={fields}
											toggleField={toggleField}
											slideOrder={slideOrder}
											setSlideOrder={setSlideOrder}
											slides={slides}
											setSlides={setSlides}
											openChordPicker={openChordPicker}
										/>
									</CollapsibleSection>
								</div>
							</div>

							{/* Row 2: Grid View spanning full width */}
							<div className="w-full">
								<CollapsibleSection
									title={t("song.slidesGridTitle", "Slides Presentation Grid")}
									icon="📊"
									isExpanded={isGridExpanded}
									onToggle={() => {
										setIsGridExpanded(!isGridExpanded);
									}}
								>
									<SlidesGridView
										fields={fields}
										slideOrder={slideOrder}
										setSlideOrder={setSlideOrder}
										slides={slides}
										setSlides={setSlides}
									/>
								</CollapsibleSection>
							</div>
						</form>
					</div>
				)}
			</div>

			{/* Form Footer */}
			<SongFormFooter
				hasChanges={hasChanges}
				isSubmitting={isSubmitting}
				isEditing={isEditing}
				onSave={handleSave}
				onReset={resetForm}
				onCancel={handleCancel}
				onDelete={handleDelete}
			/>
			{pendingChordPickerRequest === undefined ? undefined : (
				<ChordPicker
					songKey={formValues.key}
					setSongKey={(nextValue) => {
						setFormValue("key", nextValue);
					}}
					hasPendingInsertTarget
					{...(pendingChordPickerRequest.initialChordToken === undefined
						? {}
						: { initialChordToken: pendingChordPickerRequest.initialChordToken })}
					{...(pendingChordPickerRequest.isEditingChord === undefined
						? {}
						: { isEditingChord: pendingChordPickerRequest.isEditingChord })}
					closeChordPicker={closeChordPicker}
					insertChordFromPicker={insertChordFromPicker}
				/>
			)}
		</>
	);
}
