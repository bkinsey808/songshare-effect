// src/features/song-form/SongForm.tsx
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import CollapsibleSection from "./CollapsibleSection";
import SongFormFields from "./SongFormFields";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import useSongForm from "./useSongForm";

export function SongForm(): ReactElement {
	const { t } = useTranslation();
	const { song_id } = useParams<{ song_id?: string }>();

	const isEditing = Boolean(song_id?.trim()?.length);

	const {
		getFieldError,
		isSubmitting,
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

				<div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
					<form
						ref={formRef}
						className="flex w-full flex-col gap-4"
						onSubmit={handleFormSubmit}
					>
						{/* Row 1: Song Form Fields (left) + Slides Editor (right) on desktop, stacked on mobile */}
						<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
							{/* Left Column - Song Form Fields */}
							<div className="lg:flex-1">
								<CollapsibleSection
									title="Song Details"
									icon="🎵"
									isExpanded={isFormFieldsExpanded}
									onToggle={() =>
										setIsFormFieldsExpanded(!isFormFieldsExpanded)
									}
								>
									<SongFormFields
										getFieldError={getFieldError}
										onSongNameBlur={handleSongNameBlur}
										songNameRef={songNameRef}
										songSlugRef={songSlugRef}
									/>
								</CollapsibleSection>
							</div>

							{/* Right Column - Slides Editor */}
							<div className="lg:flex-1">
								<CollapsibleSection
									title="Slides Editor"
									icon="📄"
									isExpanded={isSlidesExpanded}
									onToggle={() => setIsSlidesExpanded(!isSlidesExpanded)}
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
								title="Grid View"
								icon="📊"
								isExpanded={isGridExpanded}
								onToggle={() => setIsGridExpanded(!isGridExpanded)}
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
			</div>

			{/* Form Footer */}
			<footer className="fixed right-0 bottom-0 left-0 z-50 bg-gray-800 px-5 py-4 shadow-lg">
				<div className="mx-auto max-w-screen-2xl px-6">
					<div className="flex justify-start gap-4 pl-4">
						<button
							type="button"
							onClick={handleSave}
							className="rounded bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50"
							disabled={isSubmitting}
							data-testid="create-song-button"
						>
							{isEditing
								? t("song.updateSong", "Update Song")
								: t("song.createSong", "Create Song")}
						</button>
						<button
							type="button"
							onClick={resetForm}
							className="rounded bg-gray-600 px-6 py-3 text-white transition hover:bg-gray-700 disabled:opacity-50"
							disabled={isSubmitting}
							data-testid="reset-song-button"
						>
							{t("song.reset", "Reset")}
						</button>
						<button
							type="button"
							onClick={handleCancel}
							className="rounded bg-red-600 px-6 py-3 text-white transition hover:bg-red-700 disabled:opacity-50"
							disabled={isSubmitting}
							data-testid="cancel-song-button"
						>
							{t("song.cancel", "Cancel")}
						</button>
					</div>
				</div>
			</footer>
		</>
	);
}
