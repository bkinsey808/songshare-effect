import { useTranslation } from "react-i18next";

import CreateSongIcon from "@/react/lib/design-system/icons/CreateSongIcon";
import EditSongIcon from "@/react/lib/design-system/icons/EditSongIcon";
import { convertChordsInText } from "@/shared/music/chord-display/convertChordsInText";
import convertStoredChordBody from "@/shared/music/chord-display/convertStoredChordBody";
import formatStoredChordBodyAsToken from "@/shared/music/chord-display/formatStoredChordBodyAsToken";
import normalizeStoredChordBody from "@/shared/music/chord-display/normalizeStoredChordBody";
import deriveSongChords from "@/shared/song/deriveSongChords";
import type { SongKey } from "@/shared/song/songKeyOptions";

import ChordPicker from "./chord-picker/ChordPicker";
import CollapsibleSection from "./CollapsibleSection";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import SongFormFields from "./SongFormFields";
import SongFormFooter from "./SongFormFooter";
import useSongForm from "./use-song-form/useSongForm";

/**
 * Main wrapper for the interactive song editor form.
 * Handles the actual form submission, chord picker overlay, and manages the field sections.
 *
 * @returns Song form component
 */
export default function SongForm(): ReactElement {
	const { t } = useTranslation();
	const songForm = useSongForm();

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
	} = songForm;

	/**
	 * Updates the song key and converts any absolute stored chord bodies in the
	 * chords array plus any slide lyric chord tokens to Roman-degree form.
	 *
	 * @param newKey - The newly selected song key, or `""` to clear it
	 * @returns void
	 */
	function handleKeyChange(newKey: SongKey | ""): void {
		setFormValue("key", newKey);
		if (newKey === "") {
			return;
		}
		setFormValue(
			"chords",
			formValues.chords.map((token) => convertStoredChordBody(token, newKey)),
		);
		const convertedSlides = Object.fromEntries(
			Object.entries(slides).map(([slideId, slide]) => [
				slideId,
				{
					...slide,
					field_data: Object.fromEntries(
						Object.entries(slide.field_data).map(([fieldKey, value]) => [
							fieldKey,
							convertChordsInText(value, newKey),
						]),
					),
				},
			]),
		);
		setSlides(convertedSlides);
	}

	const lyricChords = deriveSongChords({
		slideOrder,
		slides,
	});

	/**
	 * Opens the full-page chord picker to append a chord body to the song-level chord list.
	 *
	 * @returns Nothing
	 */
	function handleOpenSongChordPicker(): void {
		openChordPicker({
			submitChord: (token) => {
				const storedChordBody = normalizeStoredChordBody(token);
				if (storedChordBody === undefined) {
					return;
				}
				setFormValue(
					"chords",
					deriveSongChords({
						slideOrder,
						slides,
						existingChords: [...formValues.chords, storedChordBody],
					}),
				);
			},
		});
	}

	/**
	 * Removes a stored chord body from the song-level chord list while keeping lyric-backed chords first.
	 *
	 * @param token - Chord token to remove from the song-level list
	 * @returns Nothing
	 */
	function handleRemoveSongChord(token: string): void {
		setFormValue(
			"chords",
			deriveSongChords({
				slideOrder,
				slides,
				existingChords: formValues.chords.filter((existingToken) => existingToken !== token),
			}),
		);
	}

	/**
	 * Opens the full-page chord picker to edit an unused stored chord body.
	 *
	 * @param token - Stored chord body to edit
	 * @returns Nothing
	 */
	function handleEditSongChord(token: string): void {
		openChordPicker({
			initialChordToken: formatStoredChordBodyAsToken(token),
			isEditingChord: true,
			submitChord: (nextToken) => {
				const nextStoredChordBody = normalizeStoredChordBody(nextToken);
				if (nextStoredChordBody === undefined) {
					return;
				}
				setFormValue(
					"chords",
					deriveSongChords({
						slideOrder,
						slides,
						existingChords: formValues.chords.map((existingToken) =>
							existingToken === token ? nextStoredChordBody : existingToken,
						),
					}),
				);
			},
		});
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

				{submitError === undefined || submitError === "" ? undefined : (
					<div
						className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300"
						data-testid="song-form-submit-error"
					>
						{submitError}
					</div>
				)}

				{isLoadingData ? (
					<div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-12">
						<div className="flex flex-col items-center space-y-4">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
							<p className="text-gray-400">{t("song.loadingData", "Loading song data...")}</p>
						</div>
					</div>
				) : (
					<div className="rounded-lg border border-slate-800 bg-slate-950 p-6">
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
											onKeyChange={handleKeyChange}
											lyricChords={lyricChords}
											onOpenSongChordPicker={handleOpenSongChordPicker}
											onEditSongChord={handleEditSongChord}
											onRemoveSongChord={handleRemoveSongChord}
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
											songChords={formValues.chords}
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
										songChords={formValues.chords}
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
