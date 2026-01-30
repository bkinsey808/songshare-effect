import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import CreateSongIcon from "@/react/design-system/icons/CreateSongIcon";
import EditSongIcon from "@/react/design-system/icons/EditSongIcon";

import CollapsibleSection from "./CollapsibleSection";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import SongFormFields from "./SongFormFields";
import SongFormFooter from "./SongFormFooter";
import useSongForm from "./use-song-form/useSongForm";

export default function SongForm(): ReactElement {
	const { t } = useTranslation();
	const { song_id } = useParams<{ song_id?: string }>();

	// treat a trimmed empty string as not-editing without using numeric literals
	const isEditing = (song_id?.trim() ?? "") !== "";

	const {
		getFieldError,
		isSubmitting,
		isLoadingData,
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
		hasUnsavedChanges,
	} = useSongForm();

	// Check if there are unsaved changes for styling
	// Only check for changes when not loading to avoid flash during initial load
	// React Compiler automatically memoizes this value
	const hasChanges = isLoadingData ? false : hasUnsavedChanges();

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
		</>
	);
}
