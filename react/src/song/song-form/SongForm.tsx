import { useTranslation } from "react-i18next";

import CreateSongIcon from "@/react/lib/design-system/icons/CreateSongIcon";
import EditSongIcon from "@/react/lib/design-system/icons/EditSongIcon";

import ChordPicker from "./chord-picker/ChordPicker";
import CollapsibleSection from "./CollapsibleSection";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import SongFormFields from "./SongFormFields";
import SongFormFooter from "./SongFormFooter";
import useSongForm from "./use-song-form/useSongForm";

/**
 * Render the song creation and edit page.
 *
 * @returns React element containing the full song editor UI.
 */
export default function SongForm(): ReactElement {
	const { t } = useTranslation();

	const {
		getFieldError,
		isSubmitting,
		isLoadingData,
		submitError,
		isEditing,
		slideOrder,
		slides,
		fields,
		setSlideOrder,
		setSlides,
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

		// Chord picker state
		pendingChordPickerRequest,
		openChordPicker,
		closeChordPicker,
		insertChordFromPicker,
	} = useSongForm();

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

				{submitError === undefined || submitError === "" ? undefined : (
					<div
						className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300"
						data-testid="song-form-submit-error"
					>
						{submitError}
					</div>
				)}

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
											lyricsLanguages={formValues.lyrics}
											scriptLanguages={formValues.script}
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
										lyricsLanguages={formValues.lyrics}
										scriptLanguages={formValues.script}
										slideOrder={slideOrder}
										setSlideOrder={setSlideOrder}
										slides={slides}
										setSlides={setSlides}
										openChordPicker={openChordPicker}
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
					initialChordToken={pendingChordPickerRequest.initialChordToken}
					isEditingChord={Boolean(pendingChordPickerRequest.isEditingChord)}
					closeChordPicker={closeChordPicker}
					insertChordFromPicker={insertChordFromPicker}
				/>
			)}
		</>
	);
}
